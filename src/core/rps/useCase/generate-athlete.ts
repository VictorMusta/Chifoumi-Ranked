import { Athlete } from '../entity/athlete';
import { AthleteRepository } from '../ports/rps-repository';
import { IdGenerator } from '../../user/ports/id-generator';

export class GenerateAthleteUseCase {
  constructor(
    private readonly athleteRepo: AthleteRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(name: string): Promise<Athlete> {
    const probs = this.generateRandomProbs();
    const value = Athlete.calculateValue(probs);
    
    const athlete = new Athlete(
      this.idGenerator.generate(),
      name,
      probs,
      value
    );

    await this.athleteRepo.save(athlete);
    return athlete;
  }

  private generateRandomProbs(): { rock: number; paper: number; scissors: number } {
    const p1 = Math.floor(Math.random() * 101);
    const p2 = Math.floor(Math.random() * (101 - p1));
    const p3 = 100 - p1 - p2;

    // Mélanger pour ne pas que "rock" soit toujours favorisé par le p1
    const array = [p1, p2, p3].sort(() => Math.random() - 0.5);
    return { rock: array[0], paper: array[1], scissors: array[2] };
  }
}
