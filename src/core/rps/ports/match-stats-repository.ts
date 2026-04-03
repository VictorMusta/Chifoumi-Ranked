export interface MatchStats {
  totalRounds: number;
  totalMatches: number;
  bestStreak: number;
  bestStreakHolder: string;
}

export interface UserRpsStats {
  userId: string;
  currentStreak: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalMatches: number;
  elo: number;
  rockCount: number;
  paperCount: number;
  scissorsCount: number;
}

export interface MatchStatsRepository {
  getStats(): Promise<MatchStats>;
  updateStats(
    won: boolean,
    username: string,
    roundsInMatch: number,
  ): Promise<void>;
  updatePlayerMove(userId: string, move: string): Promise<void>;
  getPlayerStats(userId: string): Promise<UserRpsStats>;
  updateMatchRankings(
    p1Id: string,
    p2Id: string,
    winnerId: string | null,
  ): Promise<{ p1Elo: number; p2Elo: number; p1Diff: number; p2Diff: number }>;
}
