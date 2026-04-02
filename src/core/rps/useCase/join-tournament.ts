import { TournamentRepository, TeamRepository } from '../ports/rps-repository';
import { TournamentStatus } from '../entity/tournament';

export class JoinTournamentUseCase {
  constructor(
    private readonly tournamentRepo: TournamentRepository,
    private readonly teamRepo: TeamRepository,
  ) {}

  async execute(ownerId: string, tournamentId: string): Promise<void> {
    const team = await this.teamRepo.findByOwnerId(ownerId);
    if (!team) throw new Error('Équipe non trouvée');

    if (team.athletes.length < 3) {
      throw new Error(
        'Il faut au moins 3 joueurs pour participer à un tournoi',
      );
    }

    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) throw new Error('Tournoi non trouvé');

    if (tournament.status !== TournamentStatus.OPEN) {
      throw new Error("Le tournoi n'est plus ouvert aux inscriptions");
    }

    tournament.registerTeam(team.id);
    await this.tournamentRepo.save(tournament);
  }
}
