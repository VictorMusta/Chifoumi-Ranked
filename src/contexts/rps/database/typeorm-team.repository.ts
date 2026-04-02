import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamRepository } from '../../../core/rps/ports/rps-repository';
import { Team } from '../../../core/rps/entity/team';
import { Athlete } from '../../../core/rps/entity/athlete';
import { TeamOrmEntity } from './team.entity';
import { AthleteOrmEntity } from './athlete.entity';

@Injectable()
export class TypeOrmTeamRepository implements TeamRepository {
  constructor(
    @InjectRepository(TeamOrmEntity)
    private readonly repo: Repository<TeamOrmEntity>,
  ) {}

  async save(team: Team): Promise<Team> {
    const orm = this.repo.create({
      id: team.id,
      ownerId: team.ownerId,
      budget: team.budget,
    });
    await this.repo.save(orm);
    return team;
  }

  async findByOwnerId(ownerId: string): Promise<Team | null> {
    const orm = await this.repo.findOne({
      where: { ownerId },
      relations: ['athletes'],
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findById(id: string): Promise<Team | null> {
    const orm = await this.repo.findOne({
      where: { id },
      relations: ['athletes'],
    });
    return orm ? this.toDomain(orm) : null;
  }

  private toDomain(orm: TeamOrmEntity): Team {
    return new Team(
      orm.id,
      orm.ownerId,
      orm.budget,
      orm.athletes?.map((a) => this.athleteToDomain(a)) || [],
    );
  }

  private athleteToDomain(orm: AthleteOrmEntity): Athlete {
    return new Athlete(
      orm.id,
      orm.name,
      { rock: orm.probRock, paper: orm.probPaper, scissors: orm.probScissors },
      orm.value,
      orm.teamId,
    );
  }
}
