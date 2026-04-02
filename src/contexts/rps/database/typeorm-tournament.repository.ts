import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentRepository } from '../../../core/rps/ports/rps-repository';
import { Tournament, Match } from '../../../core/rps/entity/tournament';
import { TournamentOrmEntity, MatchOrmEntity } from './tournament.entity';

@Injectable()
export class TypeOrmTournamentRepository implements TournamentRepository {
  constructor(
    @InjectRepository(TournamentOrmEntity)
    private readonly tournamentRepo: Repository<TournamentOrmEntity>,
    @InjectRepository(MatchOrmEntity)
    private readonly matchRepo: Repository<MatchOrmEntity>,
  ) {}

  async save(tournament: Tournament): Promise<Tournament> {
    const orm = this.tournamentRepo.create({
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      teamIds: tournament.teamIds,
    });
    await this.tournamentRepo.save(orm);
    return tournament;
  }

  async findById(id: string): Promise<Tournament | null> {
    const orm = await this.tournamentRepo.findOne({ where: { id } });
    if (!orm) return null;
    
    // Charger les matchs pour hydrater l'agrégat
    const matches = await this.findMatchesByTournamentId(id);
    
    return new Tournament(orm.id, orm.name, orm.status, orm.teamIds, matches);
  }

  async findAll(): Promise<Tournament[]> {
    const orms = await this.tournamentRepo.find();
    return orms.map((o) => new Tournament(o.id, o.name, o.status, o.teamIds));
  }

  async saveMatch(match: Match): Promise<Match> {
    const orm = this.matchRepo.create({
      id: match.id,
      tournamentId: match.tournamentId,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      athleteAId: match.athleteAId,
      athleteBId: match.athleteBId,
      winnerId: match.winnerId,
      drawCount: match.drawCount,
    });
    await this.matchRepo.save(orm);
    return match;
  }

  async findMatchById(id: string): Promise<Match | null> {
    const orm = await this.matchRepo.findOne({ where: { id } });
    return orm
      ? new Match(
          orm.id,
          orm.tournamentId,
          orm.teamAId,
          orm.teamBId,
          orm.athleteAId,
          orm.athleteBId,
          orm.winnerId,
          orm.drawCount,
        )
      : null;
  }

  async findMatchesByTournamentId(tournamentId: string): Promise<Match[]> {
    const orms = await this.matchRepo.find({ where: { tournamentId } });
    return orms.map(
      (orm) =>
        new Match(
          orm.id,
          orm.tournamentId,
          orm.teamAId,
          orm.teamBId,
          orm.athleteAId,
          orm.athleteBId,
          orm.winnerId,
          orm.drawCount,
        ),
    );
  }
}
