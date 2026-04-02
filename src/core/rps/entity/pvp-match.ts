export type Move = 'rock' | 'paper' | 'scissors';

export class PvPMatch {
  public player1Score = 0;
  public player2Score = 0;
  public round = 1;
  public player1Move: Move | null = null;
  public player2Move: Move | null = null;
  public winnerId: string | null = null;
  public isOver = false;

  constructor(
    public readonly id: string,
    public readonly player1Id: string,
    public readonly player2Id: string,
    public readonly maxWins = 3, // Best of 5
  ) {}

  public setMove(playerId: string, move: Move): void {
    if (playerId === this.player1Id) this.player1Move = move;
    if (playerId === this.player2Id) this.player2Move = move;
  }

  public bothMoved(): boolean {
    return this.player1Move !== null && this.player2Move !== null;
  }

  public resolveRound(): { winnerId: string | null; p1Move: Move; p2Move: Move } {
    if (!this.player1Move || !this.player2Move) throw new Error('Missing moves');

    const p1Move = this.player1Move;
    const p2Move = this.player2Move;
    let roundWinnerId: string | null = null;

    if (p1Move !== p2Move) {
      if (
        (p1Move === 'rock' && p2Move === 'scissors') ||
        (p1Move === 'paper' && p2Move === 'rock') ||
        (p1Move === 'scissors' && p2Move === 'paper')
      ) {
        this.player1Score++;
        roundWinnerId = this.player1Id;
      } else {
        this.player2Score++;
        roundWinnerId = this.player2Id;
      }
    }

    this.player1Move = null;
    this.player2Move = null;
    this.round++;

    if (this.player1Score >= this.maxWins) {
      this.winnerId = this.player1Id;
      this.isOver = true;
    } else if (this.player2Score >= this.maxWins) {
      this.winnerId = this.player2Id;
      this.isOver = true;
    }

    return { winnerId: roundWinnerId, p1Move, p2Move };
  }
}
