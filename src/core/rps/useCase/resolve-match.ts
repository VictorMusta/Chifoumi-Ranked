import {
  TournamentRepository,
  AthleteRepository,
  TeamRepository,
} from '../ports/rps-repository';
import { MatchEngine } from './match-engine';
import { Match } from '../entity/tournament';
import { Team } from '../entity/team';

export class ResolveMatchUseCase {
  constructor(
    private readonly tournamentRepo: TournamentRepository,
    private readonly athleteRepo: AthleteRepository,
    private readonly teamRepo: TeamRepository,
    private readonly engine: MatchEngine,
  ) {}

  async execute(tournamentId: string, matchId: string): Promise<Match> {
    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) throw new Error('Tournoi non trouvé');

    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('Match non trouvé');
    if (match.winnerId) throw new Error('Match déjà terminé');

    // Récupérer les athlètes pour avoir leurs probabilités
    const athleteA = await this.athleteRepo.findById(match.athleteAId);
    const athleteB = await this.athleteRepo.findById(match.athleteBId);

    if (!athleteA || !athleteB) throw new Error('Athlète(s) introuvable(s)');

    // Résolution
    const resolution = this.engine.resolveDuel(athleteA, athleteB);
    const winnerId = resolution.winnerId;

    // Si nul
    if (!winnerId) {
      match.drawCount++;
      if (match.drawCount >= 3) {
        match.winnerId = Math.random() > 0.5 ? athleteA.id : athleteB.id;
      }
    } else {
      match.winnerId = winnerId;

      // Récompense monétaire pour l'équipe gagnante
      const winningTeamId =
        winnerId === athleteA.id ? match.teamAId : match.teamBId;
      const team = await this.teamRepo.findById(winningTeamId);
      if (team) {
        const updatedTeam = new Team(
          team.id,
          team.ownerId,
          team.budget + 500,
          team.athletes,
        );
        await this.teamRepo.save(updatedTeam);
      }
    }

    await this.tournamentRepo.save(tournament);
    return match;
  }
}
