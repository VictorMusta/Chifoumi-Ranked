import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('match_stats')
export class MatchStatsOrmEntity {
  @PrimaryColumn({ default: 'global' })
  id: string = 'global';

  @Column({ default: 0 })
  totalRounds: number = 0;

  @Column({ default: 0 })
  totalMatches: number = 0;

  @Column({ default: 0 })
  bestStreak: number = 0;

  @Column({ nullable: true })
  bestStreakHolder: string = '';

  // Helper to keep track of current streaks in-memory or in another table
  // For simplicity here, we assume the record holder is updated if their current streak beats the record.
}

@Entity('user_rps_stats')
export class UserRpsStatsOrmEntity {
  @PrimaryColumn()
  userId: string;

  @Column({ default: 0 })
  currentStreak: number = 0;

  @Column({ default: 0 })
  totalWins: number = 0;
}
