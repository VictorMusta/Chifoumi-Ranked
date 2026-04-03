import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MatchStatsOrmEntity,
  UserRpsStatsOrmEntity,
} from './match-stats.entity';
import {
  MatchStats,
  MatchStatsRepository,
  UserRpsStats,
} from '../../../core/rps/ports/match-stats-repository';

@Injectable()
export class TypeOrmMatchStatsRepository implements MatchStatsRepository {
  constructor(
    @InjectRepository(MatchStatsOrmEntity)
    private readonly statsRepo: Repository<MatchStatsOrmEntity>,
    @InjectRepository(UserRpsStatsOrmEntity)
    private readonly userStatsRepo: Repository<UserRpsStatsOrmEntity>,
  ) {}

  async getStats(): Promise<MatchStats> {
    let stats = await this.statsRepo.findOne({ where: { id: 'global' } });
    if (!stats) {
      stats = this.statsRepo.create({ id: 'global' });
      await this.statsRepo.save(stats);
    }
    return {
      totalRounds: stats.totalRounds,
      totalMatches: stats.totalMatches,
      bestStreak: stats.bestStreak,
      bestStreakHolder: stats.bestStreakHolder,
    };
  }

  async getPlayerStats(userId: string): Promise<UserRpsStats> {
    let stats = await this.userStatsRepo.findOne({ where: { userId } });
    if (!stats) {
      stats = this.userStatsRepo.create({ userId, elo: 1000 });
      await this.userStatsRepo.save(stats);
    }
    return stats;
  }

  async updatePlayerMove(userId: string, move: string): Promise<void> {
    const stats = (await this.getPlayerStats(userId)) as UserRpsStatsOrmEntity;
    if (move === 'rock') stats.rockCount++;
    if (move === 'paper') stats.paperCount++;
    if (move === 'scissors') stats.scissorsCount++;
    await this.userStatsRepo.save(stats);
  }

  async updateStats(
    won: boolean,
    username: string,
    roundsInMatch: number,
  ): Promise<void> {
    const stats = await this.statsRepo.findOne({ where: { id: 'global' } });
    if (stats) {
      stats.totalRounds += roundsInMatch;
      stats.totalMatches += 1;
      await this.statsRepo.save(stats);
    }
  }

  async updateMatchRankings(
    p1Id: string,
    p2Id: string,
    winnerId: string | null,
  ): Promise<{ p1Elo: number; p2Elo: number; p1Diff: number; p2Diff: number }> {
    return await this.userStatsRepo.manager.transaction(async (manager) => {
      let p1 = await manager.findOne(UserRpsStatsOrmEntity, {
        where: { userId: p1Id },
      });
      let p2 = await manager.findOne(UserRpsStatsOrmEntity, {
        where: { userId: p2Id },
      });

      if (!p1) p1 = manager.create(UserRpsStatsOrmEntity, { userId: p1Id, elo: 1000 });
      if (!p2) p2 = manager.create(UserRpsStatsOrmEntity, { userId: p2Id, elo: 1000 });

      const kFactor = 32;
      const p1Expected = 1 / (1 + Math.pow(10, (p2.elo - p1.elo) / 400));
      const p2Expected = 1 / (1 + Math.pow(10, (p1.elo - p2.elo) / 400));

      let p1Score = 0.5;
      let p2Score = 0.5;

      if (winnerId === p1Id) {
        p1Score = 1;
        p2Score = 0;
        p1.totalWins++;
        p2.totalLosses++;
        p1.currentStreak++;
        p2.currentStreak = 0;
      } else if (winnerId === p2Id) {
        p1Score = 0;
        p2Score = 1;
        p1.totalLosses++;
        p2.totalWins++;
        p1.currentStreak = 0;
        p2.currentStreak++;
      } else {
        p1.totalDraws++;
        p2.totalDraws++;
      }

      p1.totalMatches++;
      p2.totalMatches++;

      const p1NewElo = Math.round(p1.elo + kFactor * (p1Score - p1Expected));
      const p2NewElo = Math.round(p2.elo + kFactor * (p2Score - p2Expected));

      const p1Diff = p1NewElo - p1.elo;
      const p2Diff = p2NewElo - p2.elo;

      p1.elo = p1NewElo;
      p2.elo = p2NewElo;

      await manager.save(p1);
      await manager.save(p2);

      return { p1Elo: p1.elo, p2Elo: p2.elo, p1Diff, p2Diff };
    });
  }
}
