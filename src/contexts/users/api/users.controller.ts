import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  UseGuards,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { Inject, forwardRef } from '@nestjs/common';
import { RegisterUseCase } from '../../../core/user/useCase/register';
import { LoginUseCase } from '../../../core/user/useCase/login';
import { UserDto } from '../../../core/user/dto/user';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TypeOrmUserRepository } from '../database/typeorm-user.repository';
import { Skin } from '../../../core/skin/entity/skin';
import type { MatchStatsRepository } from '../../../core/rps/ports/match-stats-repository';

class RegisterBody {
  @ApiProperty({ example: 'victor' }) username: string;
  @ApiProperty({ example: 'victor@test.com' }) email: string;
  @ApiProperty({ example: 'Test1234!' }) password: string;
  @ApiProperty({
    example: 2,
    required: false,
    description:
      'Bitmask de droits : 0=aucun, 1=joueur, 2=chef_equipe, 3=admin',
  })
  permissions?: number;
}

class LoginBody {
  @ApiProperty({ example: 'victor' }) identifier: string;
  @ApiProperty({ example: 'Test1234!' }) password: string;
}

class RegisterResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' }) id: string;
  @ApiProperty({ example: 'victor' }) username: string;
  @ApiProperty({ example: 'victor@test.com' }) email: string;
  @ApiProperty({ example: 2 }) permissions: number;
}

class LoginResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}

import { TypeOrmSkinRepository } from '../../skins/database/typeorm-skin.repository';

@ApiTags('Auth')
@Controller('auth')
export class UsersController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly userRepo: TypeOrmUserRepository,
    private readonly skinRepo: TypeOrmSkinRepository,
    @Inject('MatchStatsRepository')
    private readonly statsRepo: MatchStatsRepository,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte utilisateur' })
  @ApiBody({ type: RegisterBody })
  @ApiResponse({
    status: 201,
    description: 'Compte créé',
    type: RegisterResponse,
  })
  @ApiResponse({ status: 409, description: 'Email ou username déjà utilisé' })
  async register(@Body() body: RegisterBody) {
    try {
      const user = await this.registerUseCase.execute(
        new UserDto(
          body.username,
          body.email,
          body.password,
          body.permissions ?? 0,
        ),
      );
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        permissions: user.permissions,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      if (message === 'User already exists')
        throw new ConflictException(message);
      throw e;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter et obtenir un token JWT' })
  @ApiBody({ type: LoginBody })
  @ApiResponse({
    status: 200,
    description: 'Token JWT retourné',
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: 'Credentials invalides' })
  async login(@Body() body: LoginBody) {
    try {
      return await this.loginUseCase.execute({
        identifier: body.identifier,
        password: body.password,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      if (message === 'Invalid credentials')
        throw new UnauthorizedException(message);
      throw e;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: "Obtenir les informations de l'utilisateur connecté",
  })
  async getMe(@Req() req: { user: { userId: string } }) {
    const user = await this.userRepo.findById(req.user.userId);
    if (!user) throw new UnauthorizedException('User not found');

    let activeSkinColor: string | null = null;
    const effectiveSkinId = user.activeSkinId || Skin.DEFAULT_SKIN_ID;
    if (effectiveSkinId === Skin.DEFAULT_SKIN_ID) {
      activeSkinColor = Skin.getDefault().color;
    } else {
      const skin = await this.skinRepo.findById(effectiveSkinId);
      if (skin) {
        activeSkinColor = skin.color;
      }
    }

    const stats = await this.statsRepo.getPlayerStats(req.user.userId);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      remainingTrialMatches: user.remainingTrialMatches,
      generatedReferralCode: user.generatedReferralCode,
      permissions: user.permissions,
      ownedSkinIds: Array.from(
        new Set([Skin.DEFAULT_SKIN_ID, ...(user.ownedSkinIds || [])]),
      ),
      activeSkinId: user.activeSkinId || Skin.DEFAULT_SKIN_ID,
      activeSkinColor,
      stats: {
        currentStreak: stats.currentStreak,
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses,
        totalDraws: stats.totalDraws,
        totalMatches: stats.totalMatches,
        elo: stats.elo,
        rockCount: stats.rockCount,
        paperCount: stats.paperCount,
        scissorsCount: stats.scissorsCount,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('referral/generate')
  @ApiOperation({ summary: 'Générer un code de parrainage (PRO uniquement)' })
  async generateReferral(@Req() req: { user: { userId: string } }) {
    const user = await this.userRepo.findById(req.user.userId);
    if (!user) throw new Error('User not found');
    if (user.subscriptionTier !== 2)
      throw new Error('Must be PRO to generate a code');
    if (user.generatedReferralCode) return { code: user.generatedReferralCode };

    const code = `ROCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    user.generatedReferralCode = code;
    await this.userRepo.save(user);
    return { code };
  }

  @UseGuards(JwtAuthGuard)
  @Post('referral/redeem')
  @ApiOperation({ summary: 'Utiliser un code de parrainage' })
  async redeemReferral(
    @Req() req: { user: { userId: string } },
    @Body() body: { code: string },
  ) {
    const user = await this.userRepo.findById(req.user.userId);
    if (!user) throw new Error('User not found');

    const users = await this.userRepo.findAll();
    const validCode = users.some((u) => u.generatedReferralCode === body.code);

    if (!validCode) throw new Error('Invalid referral code');

    user.subscriptionTier = 2; // Grant PRO
    await this.userRepo.save(user);
    return { success: true, message: 'You are now PRO! Rock on!' };
  }
}
