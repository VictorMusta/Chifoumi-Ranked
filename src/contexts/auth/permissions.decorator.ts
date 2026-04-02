import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../core/user/permissions/permission';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Décore une route avec les permissions bitmask requises.
 * À combiner avec JwtAuthGuard + PermissionsGuard.
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequiresPermissions(Permission.CHEF_EQUIPE)
 * @Get('admin')
 */
export const RequiresPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
