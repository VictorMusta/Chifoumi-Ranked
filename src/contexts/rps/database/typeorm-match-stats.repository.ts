import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchStats, MatchStatsRepository } from '../../../core/rps/ports/match-stats-repository';
import { MatchStatsOrmEntity, UserRpsStatsOrmEntity } from './match-stats.entity';

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

  async updateStats(won: boolean, username: string, roundsInMatch: number): Promise<void> {
    const stats = await this.statsRepo.findOne({ where: { id: 'global' } });
    if (stats) {
      stats.totalRounds += roundsInMatch;
      if (won) stats.totalMatches += 1;
      await this.statsRepo.save(stats);
    }

    // Streak logic could be more complex (we need userId), 
    // but for now let's focus on the basics or use username if it's unique enough for this demo.
  }
}
