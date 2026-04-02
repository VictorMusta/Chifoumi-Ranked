import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
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
import { RegisterUseCase } from '../../../core/user/useCase/register';
import { LoginUseCase } from '../../../core/user/useCase/login';
import { UserDto } from '../../../core/user/dto/user';

class RegisterBody {
  @ApiProperty({ example: 'victor' }) username: string;
  @ApiProperty({ example: 'victor@test.com' }) email: string;
  @ApiProperty({ example: 'Test1234!' }) password: string;
  @ApiProperty({
    example: 2,
    required: false,
    description: 'Bitmask de droits : 0=aucun, 1=joueur, 2=chef_equipe, 3=admin',
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

@ApiTags('Auth')
@Controller('auth')
export class UsersController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte utilisateur' })
  @ApiBody({ type: RegisterBody })
  @ApiResponse({ status: 201, description: 'Compte créé', type: RegisterResponse })
  @ApiResponse({ status: 409, description: 'Email ou username déjà utilisé' })
  async register(@Body() body: RegisterBody) {
    try {
      const user = await this.registerUseCase.execute(
        new UserDto(body.username, body.email, body.password, body.permissions ?? 0),
      );
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        permissions: user.permissions,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      if (message === 'User already exists') throw new ConflictException(message);
      throw e;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter et obtenir un token JWT' })
  @ApiBody({ type: LoginBody })
  @ApiResponse({ status: 200, description: 'Token JWT retourné', type: LoginResponse })
  @ApiResponse({ status: 401, description: 'Credentials invalides' })
  async login(@Body() body: LoginBody) {
    try {
      return await this.loginUseCase.execute({ identifier: body.identifier, password: body.password });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      if (message === 'Invalid credentials') throw new UnauthorizedException(message);
      throw e;
    }
  }
}
