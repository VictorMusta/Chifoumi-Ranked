export class Athlete {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly probabilities: {
      rock: number; // 0-100
      paper: number; // 0-100
      scissors: number; // 0-100
    },
    public readonly value: number,
    public readonly teamId: string | null = null,
  ) {
    const sum = this.probabilities.rock + this.probabilities.paper + this.probabilities.scissors;
    if (Math.abs(sum - 100) > 0.1) {
      throw new Error('Les probabilités doivent totaliser 100%');
    }
  }

  static calculateValue(probs: { rock: number; paper: number; scissors: number }): number {
    const maxProb = Math.max(probs.rock, probs.paper, probs.scissors);
    const basePrice = 1000;
    // Plus un joueur est prévisible (maxProb proche de 100), plus il vaut cher.
    // Un joueur équilibré (33/33/33) vaut le minimum.
    const predictabilityBonus = Math.max(0, maxProb - 33.3);
    return Math.floor(basePrice + (predictabilityBonus * 50)); // ex: 90% sur un choix -> 1000 + 56.7*50 = 3835
  }
}
