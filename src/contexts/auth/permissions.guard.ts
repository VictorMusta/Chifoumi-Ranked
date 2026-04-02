import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Permission,
  hasPermission,
} from '../../core/user/permissions/permission';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucune permission requise, accès libre
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // user est injecté par JwtAuthGuard (cf jwt.strategy.ts validate())
    const userPermissions: number = user?.permissions ?? 0;

    const allGranted = required.every((perm) =>
      hasPermission(userPermissions, perm),
    );

    if (!allGranted) {
      throw new ForbiddenException(
        `Droits insuffisants. Requis : ${required.map((p) => Permission[p]).join(', ')} (bitmask ${required.reduce((a, b) => a | b, 0)})`,
      );
    }

    return true;
  }
}
