import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (
        !token ||
        token === 'undefined' ||
        token === 'null' ||
        token === '' ||
        token === 'Bearer'
      ) {
        return false;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
