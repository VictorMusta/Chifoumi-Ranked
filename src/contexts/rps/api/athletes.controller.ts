import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { RequiresPermissions } from '../../auth/permissions.decorator';
import { Permission } from '../../../core/user/permissions/permission';
import { GenerateAthleteUseCase } from '../../../core/rps/useCase/generate-athlete';
import { TypeOrmAthleteRepository } from '../database/typeorm-athlete.repository';

@Controller('rps/athletes')
export class AthletesController {
  constructor(
    private readonly generateAthleteUseCase: GenerateAthleteUseCase,
    private readonly athleteRepo: TypeOrmAthleteRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMarket() {
    return this.athleteRepo.findAllMarketable();
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiresPermissions(Permission.JOUEUR, Permission.CHEF_EQUIPE) // Simule Admin (3)
  async generate(@Body('name') name: string) {
    return this.generateAthleteUseCase.execute(
      name || 'Pro Player ' + Math.floor(Math.random() * 1000),
    );
  }
}
