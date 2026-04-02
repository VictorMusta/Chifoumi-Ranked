import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AthleteRepository } from '../../../core/rps/ports/rps-repository';
import { Athlete } from '../../../core/rps/entity/athlete';
import { AthleteOrmEntity } from './athlete.entity';

@Injectable()
export class TypeOrmAthleteRepository implements AthleteRepository {
  constructor(
    @InjectRepository(AthleteOrmEntity)
    private readonly repo: Repository<AthleteOrmEntity>,
  ) {}

  async save(athlete: Athlete): Promise<Athlete> {
    const orm = this.repo.create({
      id: athlete.id,
      name: athlete.name,
      probRock: athlete.probabilities.rock,
      probPaper: athlete.probabilities.paper,
      probScissors: athlete.probabilities.scissors,
      value: athlete.value,
      teamId: athlete.teamId,
    });
    await this.repo.save(orm);
    return athlete;
  }

  async findById(id: string): Promise<Athlete | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAllMarketable(): Promise<Athlete[]> {
    const orms = await this.repo.find({ where: { teamId: IsNull() } });
    return orms.map((o) => this.toDomain(o));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(orm: AthleteOrmEntity): Athlete {
    return new Athlete(
      orm.id,
      orm.name,
      { rock: orm.probRock, paper: orm.probPaper, scissors: orm.probScissors },
      orm.value,
      orm.teamId,
    );
  }
}
