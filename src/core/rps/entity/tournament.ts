export enum TournamentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export class Tournament {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly status: TournamentStatus,
    public readonly teamIds: string[] = [], // UUIDs des Teams inscrites
    public readonly matches: Match[] = [],
  ) {}

  registerTeam(teamId: string) {
    if (!this.teamIds.includes(teamId)) {
      this.teamIds.push(teamId);
    }
  }
}

export class Match {
  constructor(
    public readonly id: string,
    public readonly tournamentId: string,
    public readonly teamAId: string,
    public readonly teamBId: string,
    public readonly athleteAId: string,
    public readonly athleteBId: string,
    public winnerId: string | null = null,
    public drawCount: number = 0,
  ) {}
}
