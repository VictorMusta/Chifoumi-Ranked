import { AthleteRepository, TeamRepository } from '../ports/rps-repository';

export class RecruitAthleteUseCase {
  constructor(
    private readonly athleteRepo: AthleteRepository,
    private readonly teamRepo: TeamRepository,
  ) {}

  async execute(ownerId: string, athleteId: string): Promise<void> {
    const team = await this.teamRepo.findByOwnerId(ownerId);
    if (!team) throw new Error('Équipe introuvable pour cet utilisateur');

    const athlete = await this.athleteRepo.findById(athleteId);
    if (!athlete) throw new Error('Athlète introuvable');

    if (athlete.teamId) throw new Error('Cet athlète est déjà sous contrat');

    if (!team.canAfford(athlete.value)) {
      throw new Error(`Budget insuffisant (${team.budget} < ${athlete.value})`);
    }

    if (team.isFull()) {
      throw new Error('L\'équipe est déjà complète (max 5 joueurs)');
    }

    // Mise à jour de l'athlète et de la team
    const updatedAthlete = new (athlete.constructor as any)(
      athlete.id,
      athlete.name,
      athlete.probabilities,
      athlete.value,
      team.id
    );

    const updatedTeam = new (team.constructor as any)(
      team.id,
      team.ownerId,
      team.budget - athlete.value,
      [...team.athletes, updatedAthlete]
    );

    // Persistance
    await this.athleteRepo.save(updatedAthlete);
    await this.teamRepo.save(updatedTeam);
  }
}
