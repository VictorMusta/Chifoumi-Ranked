import { Controller, Get, Post, Param, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { JoinTournamentUseCase } from '../../../core/rps/useCase/join-tournament';
import { ResolveMatchUseCase } from '../../../core/rps/useCase/resolve-match';
import { TypeOrmTournamentRepository } from '../database/typeorm-tournament.repository';
import { TournamentStatus } from '../../../core/rps/entity/tournament';
import { UuidGenerator } from '../../users/adapter/uuidGenerator';
import { Tournament } from '../../../core/rps/entity/tournament';

@Controller('rps/tournaments')
export class TournamentsController {
  constructor(
    private readonly joinUseCase: JoinTournamentUseCase,
    private readonly resolveUseCase: ResolveMatchUseCase,
    private readonly tournamentRepo: TypeOrmTournamentRepository,
    private readonly idGen: UuidGenerator,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getTournaments() {
    return this.tournamentRepo.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createTournament(@Body('name') name: string) {
    const tournament = new Tournament(this.idGen.generate(), name, TournamentStatus.OPEN, [], []);
    return this.tournamentRepo.save(tournament);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async join(@Req() req: any, @Param('id') tournamentId: string) {
    const ownerId = req.user?.userId || req.user?.id || req.user?.sub;
    await this.joinUseCase.execute(ownerId, tournamentId);
    return { message: 'Inscription réussie' };
  }

  @Post(':id/matches/:matchId/resolve')
  @UseGuards(JwtAuthGuard)
  async resolve(@Param('id') tournamentId: string, @Param('matchId') matchId: string) {
    return this.resolveUseCase.execute(tournamentId, matchId);
  }
}
