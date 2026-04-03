import { Entity, Column, PrimaryColumn, VersionColumn } from 'typeorm';

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

  @VersionColumn()
  version: number;
}

@Entity('user_rps_stats')
export class UserRpsStatsOrmEntity {
  @PrimaryColumn()
  userId: string;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  totalWins: number;

  @Column({ default: 0 })
  totalLosses: number = 0;

  @Column({ default: 0 })
  totalDraws: number = 0;

  @Column({ default: 0 })
  totalMatches: number = 0;

  @Column({ default: 1000 })
  elo: number = 1000;

  @Column({ default: 0 })
  rockCount: number = 0;

  @Column({ default: 0 })
  paperCount: number = 0;

  @Column({ default: 0 })
  scissorsCount: number = 0;

  @VersionColumn()
  version: number;
}
