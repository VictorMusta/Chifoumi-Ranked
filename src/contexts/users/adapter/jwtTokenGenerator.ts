import { TokenGenerator } from '../../../core/user/ports/token-generator';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomJwtService, JwtPayload } from '../../auth/infrastructure/custom-jwt.service';

@Injectable()
export class JwtTokenGenerator implements TokenGenerator {
  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly configService: ConfigService,
  ) {}

  generate(payload: Record<string, unknown>): string {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    
    return this.jwtService.sign(payload as unknown as JwtPayload, secret, { expiresIn });
  }
}
