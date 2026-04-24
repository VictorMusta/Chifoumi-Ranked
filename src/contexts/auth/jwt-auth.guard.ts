import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CustomJwtService, JwtPayload } from './infrastructure/custom-jwt.service';
import { SecurityPolicyService } from './security-policy.service';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    permissions: number;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly configService: ConfigService,
    private readonly securityPolicy: SecurityPolicyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant ou format invalide');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');

    try {
      const payload = this.jwtService.verify(token, secret);

      // --- Security Fingerprint Logic ---
      if (payload.fpt) {
        const currentFingerprint = this.jwtService.generateDeviceFingerprint(request);
        if (currentFingerprint !== payload.fpt) {
          const mode = this.securityPolicy.getSecurityMode({ 
            permissions: payload.permissions ?? 0 
          });
          
          const details = `User: ${payload.username}, Expected: ${payload.fpt.substring(0, 8)}..., Got: ${currentFingerprint.substring(0, 8)}...`;
          const canProceed = this.securityPolicy.handleMismatch(mode, details);
          
          if (!canProceed) {
            throw new UnauthorizedException('Security breach suspected: Device mismatch');
          }
        }
      }
      // ----------------------------------

      // Mapping matching the old JwtStrategy
      request.user = {
        userId: payload.sub,
        username: payload.username,
        email: payload.email,
        permissions: payload.permissions ?? 0,
      };

      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Authentification échouée';
      throw new UnauthorizedException(message);
    }
  }
}
