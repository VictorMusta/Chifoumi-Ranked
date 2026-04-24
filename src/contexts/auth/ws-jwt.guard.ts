import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { CustomJwtService, JwtPayload } from './infrastructure/custom-jwt.service';
import { SecurityPolicyService } from './security-policy.service';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly configService: ConfigService,
    private readonly securityPolicy: SecurityPolicyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient<AuthenticatedSocket>();
      const handshake = client.handshake;
      const auth = handshake?.auth;
      const query = handshake?.query;
      const headers = handshake?.headers;

      // Ensure token is safely retrieved from string or string[]
      const authHeader = Array.isArray(headers?.authorization) 
        ? headers.authorization[0] 
        : headers?.authorization;

      const token =
        (auth?.token as string | undefined) ||
        (query?.token as string | undefined) ||
        authHeader?.split(' ')[1];

      if (
        !token ||
        ['undefined', 'null', '', 'Bearer'].includes(token)
      ) {
        return false;
      }

      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, secret);

      // --- Security Fingerprint Logic ---
      if (payload.fpt) {
        // Handshake contains headers + address (ip)
        const fingerprintReq = {
          headers: handshake.headers as Record<string, string>,
          ip: handshake.address,
        };
        const currentFingerprint = this.jwtService.generateDeviceFingerprint(fingerprintReq);
        
        if (currentFingerprint !== payload.fpt) {
          const mode = this.securityPolicy.getSecurityMode({ 
            permissions: payload.permissions ?? 0 
          });
          
          const details = `[WS] User: ${payload.username}, Expected: ${payload.fpt.substring(0, 8)}..., Got: ${currentFingerprint.substring(0, 8)}...`;
          const canProceed = this.securityPolicy.handleMismatch(mode, details);
          
          if (!canProceed) return false;
        }
      }
      // ----------------------------------

      client.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
