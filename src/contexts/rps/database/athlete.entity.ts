import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { TeamOrmEntity } from './team.entity';

@Entity('athletes')
export class AthleteOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('float')
  probRock: number;

  @Column('float')
  probPaper: number;

  @Column('float')
  probScissors: number;

  @Column('int')
  value: number;

  @Column({ type: 'uuid', nullable: true })
  teamId: string | null;

  @ManyToOne(() => TeamOrmEntity, (team) => team.athletes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  team: TeamOrmEntity | null;

  @CreateDateColumn()
  createdAt: Date;
}
