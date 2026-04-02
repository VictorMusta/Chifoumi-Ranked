import { Athlete } from '../entity/athlete';
import { AthleteRepository } from '../ports/rps-repository';
import { UuidGenerator } from '../../../contexts/users/adapter/uuidGenerator';

export class CreateStarterSquadUseCase {
  constructor(
    private readonly athleteRepo: AthleteRepository,
    private readonly idGen: UuidGenerator,
  ) {}

  async execute(teamId: string): Promise<Athlete[]> {
    const names = ['Rookie Rock', 'Paper Trail', 'Scissors Hand'];
    const athletes: Athlete[] = [];

    for (const name of names) {
      const probs = { rock: 33.3, paper: 33.3, scissors: 33.4 };
      const value = Athlete.calculateValue(probs);
      const athlete = new Athlete(
        this.idGen.generate(),
        name,
        probs,
        value,
        teamId,
      );
      await this.athleteRepo.save(athlete);
      athletes.push(athlete);
    }

    return athletes;
  }
}
