import { Injectable } from '@nestjs/common';
import { PvPMatch } from '../../core/rps/entity/pvp-match';

@Injectable()
export class MatchStore {
  private matches = new Map<string, PvPMatch>();
  private queue: { socketId: string; userId: string; username: string }[] = [];

  public addToQueue(socketId: string, userId: string, username: string): { player1: any; player2: any } | null {
    // Eviter de s'ajouter soi-même
    if (this.queue.find(q => q.userId === userId)) {
      console.log(`[MatchStore] User ${userId} (${username}) already in queue, ignoring.`);
      return null;
    }

    if (this.queue.length > 0) {
      const opponent = this.queue.shift()!;
      return {
        player1: opponent,
        player2: { socketId, userId, username }
      };
    }

    this.queue.push({ socketId, userId, username });
    console.log(`[MatchStore] User ${username} added to queue. Queue size: ${this.queue.length}`);
    return null;
  }

  public removeFromQueue(socketId: string): void {
    this.queue = this.queue.filter(q => q.socketId !== socketId);
  }

  public saveMatch(match: PvPMatch): void {
    this.matches.set(match.id, match);
  }

  public getMatch(matchId: string): PvPMatch | undefined {
    return this.matches.get(matchId);
  }

  public removeMatch(matchId: string): void {
    this.matches.delete(matchId);
  }
}
