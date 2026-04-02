import { Move, PvPMatch } from '../entity/pvp-match';
import { User } from '../../user/entity/user';

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
  async execute(
    match: PvPMatch,
    player: User,
    move: Move,
    playerPos?: 1 | 2,
  ): Promise<RoundResult | null> {
    if (match.isOver) return null;

    // Determine position if not provided (fallback)
    const pos = playerPos || (player.id === match.player1Id ? 1 : 2);

    // --- Move Validation and Normalization ---
    const normalizedMove = (move as string).toLowerCase() as Move;
    if (!['rock', 'paper', 'scissors'].includes(normalizedMove)) {
      throw new Error(
        `C'est quoi ce coup ? "${move}" n'existe pas dans mon monde.`,
      );
    }

    // Check if player already moved in this round using position
    if (pos === 1 && match.player1Move !== null) {
      throw new Error('Calme-toi ! Tu as déjà choisi ton coup pour ce tour.');
    }
    if (pos === 2 && match.player2Move !== null) {
      throw new Error('Calme-toi ! Tu as déjà choisi ton coup pour ce tour.');
    }

    // --- Absurd Paywall Logic ---
    const isPro =
      player.subscriptionTier === 2 || player.remainingTrialMatches > 0;
    const isBasic = player.subscriptionTier === 1;

    if (normalizedMove === 'rock' && !isPro) {
      if (!isBasic) {
        throw new Error(
          'Pierre verrouillée ! Achetez le pack PRO ou utilisez un code ami.',
        );
      }

      const rockCount = match.moveCounts[player.id]?.rock ?? 0;
      if (rockCount >= 2) {
        throw new Error(
          'Limite de Pierre atteinte pour ce combat (Max 2 pour Basic).',
        );
      }
    }
    // ----------------------------

    match.setMoveByPosition(pos, normalizedMove);

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
