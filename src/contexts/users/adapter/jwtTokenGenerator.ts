import { TokenGenerator } from '../../../core/user/ports/token-generator';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtTokenGenerator implements TokenGenerator {
  constructor(private readonly jwtService: JwtService) {}

  generate(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload);
  }
}
