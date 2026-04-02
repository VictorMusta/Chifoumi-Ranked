import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserOrmEntity } from '../database/user.entity';
import { TypeOrmUserRepository } from '../database/typeorm-user.repository';
import { PasswordHasherAdapter } from '../adapter/passwordHasher';
import { UuidGenerator } from '../adapter/uuidGenerator';
import { JwtTokenGenerator } from '../adapter/jwtTokenGenerator';
import { RegisterUseCase } from '../../../core/user/useCase/register';
import { LoginUseCase } from '../../../core/user/useCase/login';
import { UsersController } from './users.controller';
import { RoutesController } from './routes.controller';
import { AdminController } from './admin.controller';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { PermissionsGuard } from '../../auth/permissions.guard';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController, RoutesController, AdminController],
  providers: [
    TypeOrmUserRepository,
    PasswordHasherAdapter,
    UuidGenerator,
    JwtTokenGenerator,
    JwtStrategy,
    PermissionsGuard,
    {
      provide: RegisterUseCase,
      useFactory: (
        repo: TypeOrmUserRepository,
        hasher: PasswordHasherAdapter,
        idGen: UuidGenerator,
      ) => new RegisterUseCase(repo, hasher, idGen),
      inject: [TypeOrmUserRepository, PasswordHasherAdapter, UuidGenerator],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        repo: TypeOrmUserRepository,
        hasher: PasswordHasherAdapter,
        tokenGen: JwtTokenGenerator,
      ) => new LoginUseCase(repo, hasher, tokenGen),
      inject: [TypeOrmUserRepository, PasswordHasherAdapter, JwtTokenGenerator],
    },
  ],
  exports: [
    TypeOrmUserRepository,
    RegisterUseCase,
    LoginUseCase,
    PassportModule,
    JwtStrategy,
    JwtModule,
  ],
})
export class UsersModule {}
