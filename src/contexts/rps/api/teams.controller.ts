import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RecruitAthleteUseCase } from '../../../core/rps/useCase/recruit-athlete';
import { CreateStarterSquadUseCase } from '../../../core/rps/useCase/create-starter-squad';
import { TypeOrmTeamRepository } from '../database/typeorm-team.repository';
import { Team } from '../../../core/rps/entity/team';
import { UuidGenerator } from '../../users/adapter/uuidGenerator';

@Controller('rps/teams')
export class TeamsController {
  constructor(
    private readonly recruitAthleteUseCase: RecruitAthleteUseCase,
    private readonly createStarterSquadUseCase: CreateStarterSquadUseCase,
    private readonly teamRepo: TypeOrmTeamRepository,
    private readonly idGen: UuidGenerator,
  ) {}

  @Get('my-team')
  @UseGuards(JwtAuthGuard)
  async getMyTeam(@Req() req: any) {
    const ownerId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('[TeamsController] getMyTeam for ownerId:', ownerId);

    if (!ownerId) {
      console.error(
        '[TeamsController] Request user object is missing ID:',
        req.user,
      );
      throw new Error('User ID missing in request');
    }

    let team = await this.teamRepo.findByOwnerId(ownerId);

    if (!team) {
      console.log('[TeamsController] Generating new team for:', ownerId);
      const teamId = this.idGen.generate();
      const starterAthletes =
        await this.createStarterSquadUseCase.execute(teamId);

      team = new Team(teamId, ownerId, 1000, starterAthletes);
      await this.teamRepo.save(team);
      console.log(
        '[TeamsController] Team created with',
        starterAthletes.length,
        'athletes',
      );
    }

    // Return plain object for guaranteed serialization
    return {
      id: team.id,
      ownerId: team.ownerId,
      budget: team.budget,
      athletes: team.athletes.map((a) => ({
        id: a.id,
        name: a.name,
        probabilities: a.probabilities,
        value: a.value,
        teamId: a.teamId,
      })),
    };
  }

  @Post('recruit/:athleteId')
  @UseGuards(JwtAuthGuard)
  async recruit(@Req() req: any, @Param('athleteId') athleteId: string) {
    const ownerId = req.user?.userId || req.user?.id || req.user?.sub;
    await this.recruitAthleteUseCase.execute(ownerId, athleteId);
    return { message: 'Recrutement réussi' };
  }
}
