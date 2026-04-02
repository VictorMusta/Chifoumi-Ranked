import { Athlete } from './athlete';

export class Team {
  constructor(
    public readonly id: string,
    public readonly ownerId: string, // UUID du Chef d'équipe (User)
    public readonly budget: number,
    public readonly athletes: Athlete[] = [],
  ) {}

  canAfford(athleteValue: number): boolean {
    return this.budget >= athleteValue;
  }

  isFull(): boolean {
    return this.athletes.length >= 5; // Limite arbitraire de 5 joueurs par équipe
  }
}
