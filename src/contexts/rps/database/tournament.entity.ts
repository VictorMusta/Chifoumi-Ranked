import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { TournamentStatus } from '../../../core/rps/entity/tournament';

@Entity('tournaments')
export class TournamentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.OPEN,
  })
  status: TournamentStatus;

  @Column('simple-array')
  teamIds: string[]; // List of IDs

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('matches')
export class MatchOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tournamentId: string;

  @Column({ type: 'uuid' })
  teamAId: string;

  @Column({ type: 'uuid' })
  teamBId: string;

  @Column({ type: 'uuid' })
  athleteAId: string;

  @Column({ type: 'uuid' })
  athleteBId: string;

  @Column({ type: 'uuid', nullable: true })
  winnerId: string | null;

  @Column({ type: 'int', default: 0 })
  drawCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
