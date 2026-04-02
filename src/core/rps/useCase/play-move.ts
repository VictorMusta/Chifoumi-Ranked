import { Move, PvPMatch } from '../entity/pvp-match';

export interface RoundResult {
  p1Move: Move;
  p2Move: Move;
  winnerId: string | null;
  p1Score: number;
  p2Score: number;
  isMatchOver: boolean;
  matchWinnerId: string | null;
}

export class PlayMoveUseCase {
  async execute(match: PvPMatch, playerId: string, move: Move): Promise<RoundResult | null> {
    if (match.isOver) return null;

    match.setMove(playerId, move);

    if (match.bothMoved()) {
      const { winnerId, p1Move, p2Move } = match.resolveRound();
      return {
        p1Move,
        p2Move,
        winnerId,
        p1Score: match.player1Score,
        p2Score: match.player2Score,
        isMatchOver: match.isOver,
        matchWinnerId: match.winnerId,
      };
    }

    return null;
  }
}
