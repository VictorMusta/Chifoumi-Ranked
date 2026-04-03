import { Injectable } from '@nestjs/common';
import { PvPMatch } from '../../core/rps/entity/pvp-match';

export interface PlayerQueueInfo {
  socketId: string;
  userId: string;
  username: string;
}

@Injectable()
export class MatchStore {
  private matches = new Map<string, PvPMatch>();
  private socketToPlayerInfo = new Map<
    string,
    { matchId: string; playerPosition: 1 | 2 }
  >();
  private queue: PlayerQueueInfo[] = [];

  public addToQueue(
    socketId: string,
    userId: string,
    username: string,
  ): { player1: PlayerQueueInfo; player2: PlayerQueueInfo } | null {
    // Eviter de s'ajouter soi-même
    if (this.queue.find((q) => q.userId === userId)) {
      console.log(
        `[MatchStore] User ${userId} (${username}) already in queue, ignoring.`,
      );
      return null;
    }

    if (this.queue.length > 0) {
      const opponent = this.queue.shift()!;
      return {
        player1: opponent,
        player2: { socketId, userId, username },
      };
    }

    this.queue.push({ socketId, userId, username });
    console.log(
      `[MatchStore] User ${username} added to queue. Queue size: ${this.queue.length}`,
    );
    return null;
  }

  public removeFromQueue(socketId: string): void {
    const found = this.queue.find((q) => q.socketId === socketId);
    if (found) {
      console.log(
        `[MatchStore] Removing ${found.username} (socket: ${socketId}) from queue. Queue size before: ${this.queue.length}`,
      );
    }
    this.queue = this.queue.filter((q) => q.socketId !== socketId);
  }

  public saveMatch(
    match: PvPMatch,
    p1SocketId: string,
    p2SocketId: string,
  ): void {
    this.matches.set(match.id, match);
    this.socketToPlayerInfo.set(p1SocketId, {
      matchId: match.id,
      playerPosition: 1,
    });
    this.socketToPlayerInfo.set(p2SocketId, {
      matchId: match.id,
      playerPosition: 2,
    });
  }

  public getMatch(matchId: string): PvPMatch | undefined {
    return this.matches.get(matchId);
  }

  public getPlayerInfoBySocket(
    socketId: string,
  ): { matchId: string; playerPosition: 1 | 2 } | undefined {
    return this.socketToPlayerInfo.get(socketId);
  }

  public removeMatch(matchId: string): void {
    this.matches.delete(matchId);
    // Cleanup socket mapping
    for (const [sid, info] of this.socketToPlayerInfo.entries()) {
      if (info.matchId === matchId) this.socketToPlayerInfo.delete(sid);
    }
  }
}
