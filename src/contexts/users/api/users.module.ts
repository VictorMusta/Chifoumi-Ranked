import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

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
import { PermissionsGuard } from '../../auth/permissions.guard';
import { CustomJwtService } from '../../auth/infrastructure/custom-jwt.service';
import { SecurityPolicyService } from '../../auth/security-policy.service';

import { SkinsModule } from '../../skins/skins.module';
import { RpsModule } from '../../rps/rps.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserOrmEntity]),
    forwardRef(() => SkinsModule),
    forwardRef(() => RpsModule),
  ],
  controllers: [UsersController, RoutesController, AdminController],
  providers: [
    TypeOrmUserRepository,
    PasswordHasherAdapter,
    UuidGenerator,
    JwtTokenGenerator,
    CustomJwtService,
    SecurityPolicyService,
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
    CustomJwtService,
    SecurityPolicyService,
  ],
})
export class UsersModule {}
