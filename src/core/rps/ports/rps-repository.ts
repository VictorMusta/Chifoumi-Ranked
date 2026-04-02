import { Athlete } from '../entity/athlete';
import { Team } from '../entity/team';
import { Tournament, Match } from '../entity/tournament';

export interface AthleteRepository {
  save(athlete: Athlete): Promise<Athlete>;
  findById(id: string): Promise<Athlete | null>;
  findAllMarketable(): Promise<Athlete[]>; // Ceux qui n'ont pas de team
  delete(id: string): Promise<void>;
}

export interface TeamRepository {
  save(team: Team): Promise<Team>;
  findByOwnerId(ownerId: string): Promise<Team | null>;
  findById(id: string): Promise<Team | null>;
}

export interface TournamentRepository {
  save(tournament: Tournament): Promise<Tournament>;
  findById(id: string): Promise<Tournament | null>;
  findAll(): Promise<Tournament[]>;
  saveMatch(match: Match): Promise<Match>;
  findMatchById(id: string): Promise<Match | null>;
  findMatchesByTournamentId(tournamentId: string): Promise<Match[]>;
}
