export interface MatchStats {
  totalRounds: number;
  totalMatches: number;
  bestStreak: number;
  bestStreakHolder: string;
}

export interface MatchStatsRepository {
  getStats(): Promise<MatchStats>;
  updateStats(
    won: boolean,
    username: string,
    roundsInMatch: number,
  ): Promise<void>;
}
