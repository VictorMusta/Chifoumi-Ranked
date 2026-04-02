import { Athlete } from '../entity/athlete';

export enum RpsChoice {
  ROCK = 'ROCK',
  PAPER = 'PAPER',
  SCISSORS = 'SCISSORS',
}

export class MatchEngine {
  resolveDuel(
    athleteA: Athlete,
    athleteB: Athlete,
  ): {
    choiceA: RpsChoice;
    choiceB: RpsChoice;
    winnerId: string | null;
  } {
    const choiceA = this.getWeightedChoice(athleteA.probabilities);
    const choiceB = this.getWeightedChoice(athleteB.probabilities);

    if (choiceA === choiceB) {
      return { choiceA, choiceB, winnerId: null };
    }

    const aWins =
      (choiceA === RpsChoice.ROCK && choiceB === RpsChoice.SCISSORS) ||
      (choiceA === RpsChoice.PAPER && choiceB === RpsChoice.ROCK) ||
      (choiceA === RpsChoice.SCISSORS && choiceB === RpsChoice.PAPER);

    return {
      choiceA,
      choiceB,
      winnerId: aWins ? athleteA.id : athleteB.id,
    };
  }

  private getWeightedChoice(probs: {
    rock: number;
    paper: number;
    scissors: number;
  }): RpsChoice {
    const r = Math.random() * 100;
    if (r < probs.rock) return RpsChoice.ROCK;
    if (r < probs.rock + probs.paper) return RpsChoice.PAPER;
    return RpsChoice.SCISSORS;
  }
}
