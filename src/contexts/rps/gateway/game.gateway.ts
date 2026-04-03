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

interface AuthenticatedSocket extends Socket {
  user?: {
    id?: string;
    sub?: string;
    username: string;
  };
}
import { WsJwtAuthGuard } from '../../auth/ws-jwt.guard';
import { MatchStore } from '../match-store.service';
import { PvPMatch, Move } from '../../../core/rps/entity/pvp-match';
import { PlayMoveUseCase } from '../../../core/rps/useCase/play-move';
import { TypeOrmMatchStatsRepository } from '../database/typeorm-match-stats.repository';
import { TypeOrmUserRepository } from '../../users/database/typeorm-user.repository';

@WebSocketGateway({ namespace: 'game' })
@UseGuards(WsJwtAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly matchStore: MatchStore,
    private readonly playMoveUseCase: PlayMoveUseCase,
    private readonly statsRepo: TypeOrmMatchStatsRepository,
    private readonly userRepo: TypeOrmUserRepository,
  ) {}

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {
    console.log(`[GameGateway] Socket disconnected: ${client.id}`);
    this.matchStore.removeFromQueue(client.id);

    // Check if player was in a match
    const info = this.matchStore.getPlayerInfoBySocket(client.id);
    if (info) {
      const match = this.matchStore.getMatch(info.matchId);
      if (match && !match.isOver) {
        this.server.to(info.matchId).emit('matchOver', {
          winnerId:
            info.playerPosition === 1 ? match.player2Id : match.player1Id,
          reason: 'L’adversaire a pris la fuite !',
        });
        this.matchStore.removeMatch(info.matchId);
      }
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinQueue')
  handleJoinQueue(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.user;
    if (!user) {
      console.warn(`[GameGateway] No user found on client ${client.id}`);
      return;
    }

    const userId = user.id || user.sub || '';
    const username = user.username || 'Anonymous';

    const pairing = this.matchStore.addToQueue(
      client.id,
      userId,
      username,
    );

    if (pairing) {
      const matchId = `match_${pairing.player1.userId}_${pairing.player2.userId}_${Date.now()}`;
      const match = new PvPMatch(
        matchId,
        pairing.player1.userId,
        pairing.player1.username,
        pairing.player2.userId,
        pairing.player2.username,
      );
      this.matchStore.saveMatch(
        match,
        pairing.player1.socketId,
        pairing.player2.socketId,
      );

      // Join both players to the match room
      this.server.in(pairing.player1.socketId).socketsJoin(matchId);
      this.server.in(pairing.player2.socketId).socketsJoin(matchId);

      // Inform each player individually of their position (to handle Victor vs Victor)
      this.server.to(pairing.player1.socketId).emit('matchFound', {
        matchId,
        yourPosition: 1,
        p1Id: pairing.player1.userId,
        p2Id: pairing.player2.userId,
        opponent1: pairing.player1.username,
        opponent2: pairing.player2.username,
      });
      this.server.to(pairing.player2.socketId).emit('matchFound', {
        matchId,
        yourPosition: 2,
        p1Id: pairing.player1.userId,
        p2Id: pairing.player2.userId,
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
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; move: Move },
  ) {
    const user = client.user;
    const userId = user?.id || user?.sub;
    if (!userId) {
      console.warn(`[GameGateway] No user ID found on client ${client.id}`);
      return;
    }

    const match = this.matchStore.getMatch(data.matchId);

    if (!match || match.isOver) return;

    // Fetch full user daily to check tier/trial
    const fullUser = await this.userRepo.findById(userId);
    if (!fullUser) {
      console.warn(`[GameGateway] Full user not found for ID ${userId}`);
      return;
    }
    // Use socket info to determine position (handles Victor vs Victor)
    const info = this.matchStore.getPlayerInfoBySocket(client.id);
    if (!info) return;

    try {
      const result = await this.playMoveUseCase.execute(
        match,
        fullUser,
        data.move,
        info.playerPosition,
      );

      if (result) {
        // Track move counts for stats
        await this.statsRepo.updatePlayerMove(match.player1Id, result.p1Move);
        await this.statsRepo.updatePlayerMove(match.player2Id, result.p2Move);

        // Round is finished
        this.server.to(data.matchId).emit('roundResult', result);

        // Emit to all clients so they see the real-time round count update if they want
        const globalStats = await this.statsRepo.getStats();
        this.server.emit('globalStatsUpdate', globalStats);

        if (result.isMatchOver) {
          const winnerUsername =
            result.matchWinnerId === match.player1Id
              ? match.player1Username
              : match.player2Username;

          // Global stats
          await this.statsRepo.updateStats(true, winnerUsername, match.round);

          // ELO and Personal Stats
          const eloResults = await this.statsRepo.updateMatchRankings(
            match.player1Id,
            match.player2Id,
            result.matchWinnerId,
          );

          this.server.to(data.matchId).emit('matchOver', {
            winnerId: result.matchWinnerId,
            winnerUsername,
            p1Score: result.p1Score,
            p2Score: result.p2Score,
            elo: eloResults,
          });

          // Decrement trial matches for both players if they are in trial
          const p1 = await this.userRepo.findById(match.player1Id);
          const p2 = await this.userRepo.findById(match.player2Id);

          if (p1 && p1.remainingTrialMatches > 0) {
            await this.userRepo.save({
              ...p1,
              remainingTrialMatches: p1.remainingTrialMatches - 1,
            });
          }
          if (p2 && p2.remainingTrialMatches > 0) {
            await this.userRepo.save({
              ...p2,
              remainingTrialMatches: p2.remainingTrialMatches - 1,
            });
          }

          this.matchStore.removeMatch(data.matchId);
        }
      } else {
        client.emit('moveAccepted');
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('getStats')
  async handleGetStats(@ConnectedSocket() client: AuthenticatedSocket) {
    const stats = await this.statsRepo.getStats();
    client.emit('stats', stats);
  }
}
