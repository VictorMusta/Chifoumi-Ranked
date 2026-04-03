import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AthleteOrmEntity } from './database/athlete.entity';
import { TeamOrmEntity } from './database/team.entity';
import {
  TournamentOrmEntity,
  MatchOrmEntity,
} from './database/tournament.entity';
import { TypeOrmAthleteRepository } from './database/typeorm-athlete.repository';
import { TypeOrmTeamRepository } from './database/typeorm-team.repository';
import { TypeOrmTournamentRepository } from './database/typeorm-tournament.repository';
import { GenerateAthleteUseCase } from '../../core/rps/useCase/generate-athlete';
import { RecruitAthleteUseCase } from '../../core/rps/useCase/recruit-athlete';
import { UuidGenerator } from '../users/adapter/uuidGenerator';

import { AthletesController } from './api/athletes.controller';
import { TeamsController } from './api/teams.controller';
import { TournamentsController } from './api/tournaments.controller';
import { MatchEngine } from '../../core/rps/useCase/match-engine';
import { JoinTournamentUseCase } from '../../core/rps/useCase/join-tournament';
import { ResolveMatchUseCase } from '../../core/rps/useCase/resolve-match';
import { CreateStarterSquadUseCase } from '../../core/rps/useCase/create-starter-squad';

import { GameGateway } from './gateway/game.gateway';
import { MatchStore } from './match-store.service';
import { PlayMoveUseCase } from '../../core/rps/useCase/play-move';
import { TypeOrmMatchStatsRepository } from './database/typeorm-match-stats.repository';
import { WsJwtAuthGuard } from '../auth/ws-jwt.guard';
import {
  MatchStatsOrmEntity,
  UserRpsStatsOrmEntity,
} from './database/match-stats.entity';

import { UsersModule } from '../users/api/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AthleteOrmEntity,
      TeamOrmEntity,
      TournamentOrmEntity,
      MatchOrmEntity,
      MatchStatsOrmEntity,
      UserRpsStatsOrmEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [
    TypeOrmAthleteRepository,
    TypeOrmTeamRepository,
    TypeOrmTournamentRepository,
    UuidGenerator,
    MatchEngine,
    MatchStore,
    GameGateway,
    PlayMoveUseCase,
    TypeOrmMatchStatsRepository,
    WsJwtAuthGuard,
    {
      provide: 'MatchStatsRepository',
      useClass: TypeOrmMatchStatsRepository,
    },
    {
      provide: GenerateAthleteUseCase,
      useFactory: (repo: TypeOrmAthleteRepository, idGen: UuidGenerator) =>
        new GenerateAthleteUseCase(repo, idGen),
      inject: [TypeOrmAthleteRepository, UuidGenerator],
    },
    {
      provide: RecruitAthleteUseCase,
      useFactory: (
        athleteRepo: TypeOrmAthleteRepository,
        teamRepo: TypeOrmTeamRepository,
      ) => new RecruitAthleteUseCase(athleteRepo, teamRepo),
      inject: [TypeOrmAthleteRepository, TypeOrmTeamRepository],
    },
    {
      provide: JoinTournamentUseCase,
      useFactory: (
        tournamentRepo: TypeOrmTournamentRepository,
        teamRepo: TypeOrmTeamRepository,
      ) => new JoinTournamentUseCase(tournamentRepo, teamRepo),
      inject: [TypeOrmTournamentRepository, TypeOrmTeamRepository],
    },
    {
      provide: ResolveMatchUseCase,
      useFactory: (
        tournamentRepo: TypeOrmTournamentRepository,
        athleteRepo: TypeOrmAthleteRepository,
        teamRepo: TypeOrmTeamRepository,
        engine: MatchEngine,
      ) =>
        new ResolveMatchUseCase(tournamentRepo, athleteRepo, teamRepo, engine),
      inject: [
        TypeOrmTournamentRepository,
        TypeOrmAthleteRepository,
        TypeOrmTeamRepository,
        MatchEngine,
      ],
    },
    {
      provide: CreateStarterSquadUseCase,
      useFactory: (
        athleteRepo: TypeOrmAthleteRepository,
        idGen: UuidGenerator,
      ) => new CreateStarterSquadUseCase(athleteRepo, idGen),
      inject: [TypeOrmAthleteRepository, UuidGenerator],
    },
  ],
  controllers: [AthletesController, TeamsController, TournamentsController],
  exports: [
    GenerateAthleteUseCase,
    RecruitAthleteUseCase,
    JoinTournamentUseCase,
    ResolveMatchUseCase,
    CreateStarterSquadUseCase,
    'MatchStatsRepository',
  ],
})
export class RpsModule {}
