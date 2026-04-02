import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../auth/ws-jwt.guard';
import { MatchStore } from '../match-store.service';
import { PvPMatch, Move } from '../../../core/rps/entity/pvp-match';
import { PlayMoveUseCase } from '../../../core/rps/useCase/play-move';
import { TypeOrmMatchStatsRepository } from '../database/typeorm-match-stats.repository';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({ namespace: 'game' })
@UseGuards(WsJwtAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly matchStore: MatchStore,
    private readonly playMoveUseCase: PlayMoveUseCase,
    private readonly statsRepo: TypeOrmMatchStatsRepository,
  ) {}

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {
    this.matchStore.removeFromQueue(client.id);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinQueue')
  handleJoinQueue(@ConnectedSocket() client: Socket) {
    const user = (client as any).user;
    if (!user) {
      console.warn(`[GameGateway] No user found on client ${client.id}`);
      return;
    }

    const pairing = this.matchStore.addToQueue(client.id, user.id || user.sub, user.username);
    
    if (pairing) {
      const matchId = uuidv4();
      const match = new PvPMatch(matchId, pairing.player1.userId, pairing.player2.userId);
      this.matchStore.saveMatch(match);

      // Join both players to the match room
      this.server.in(pairing.player1.socketId).socketsJoin(matchId);
      this.server.in(pairing.player2.socketId).socketsJoin(matchId);

      // Inform both players
      this.server.to(matchId).emit('matchFound', {
        matchId,
        opponent1: pairing.player1.username,
        opponent2: pairing.player2.username,
      });

    } else {
      client.emit('queueJoined');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('playMove')
  async handlePlayMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; move: Move }
  ) {
    const user = (client as any).user;
    const match = this.matchStore.getMatch(data.matchId);

    if (!match || match.isOver) return;

    const result = await this.playMoveUseCase.execute(match, user.id || user.sub, data.move);

    if (result) {
      // Round is finished
      this.server.to(data.matchId).emit('roundResult', result);
      
      // Emit to all clients so they see the real-time round count update if they want
      const globalStats = await this.statsRepo.getStats();
      this.server.emit('globalStatsUpdate', globalStats);

      if (result.isMatchOver) {
        
        const winnerUsername = result.matchWinnerId === match.player1Id ? "Joueur 1" : "Joueur 2"; // Simplified
        await this.statsRepo.updateStats(true, winnerUsername, match.round);

        this.server.to(data.matchId).emit('matchOver', {
          winnerId: result.matchWinnerId
        });
        this.matchStore.removeMatch(data.matchId);
      }
    } else {
      client.emit('moveAccepted');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getStats')
  async handleGetStats(@ConnectedSocket() client: Socket) {
     const stats = await this.statsRepo.getStats();
     client.emit('stats', stats);
  }
}
