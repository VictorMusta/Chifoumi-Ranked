import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { AthleteOrmEntity } from './athlete.entity';

@Entity('teams')
export class TeamOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string; // Link to the user (Chef d'équipe)

  @Column({ type: 'int', default: 5000 })
  budget: number;

  @OneToMany(() => AthleteOrmEntity, (athlete) => athlete.team)
  athletes: AthleteOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
