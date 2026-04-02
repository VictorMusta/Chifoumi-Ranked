import {
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../contexts/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../contexts/auth/permissions.guard';
import { RequiresPermissions } from '../../../contexts/auth/permissions.decorator';
import { Permission } from '../../../core/user/permissions/permission';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  /**
   * Route publique — aucune authentification requise.
   */
  @Get('random')
  @ApiOperation({ summary: 'Route publique (RandomRoute)' })
  @ApiResponse({ status: 200, description: 'Données aléatoires publiques' })
  randomRoute() {
    return {
      message: 'RandomRoute — accès libre, aucun token requis',
      timestamp: new Date().toISOString(),
      random: Math.round(Math.random() * 10000),
    };
  }

  /**
   * Route protégée — JWT valide + bit CHEF_EQUIPE (0b10) requis.
   * Un user avec permissions = 0b11 (admin) passe aussi.
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiresPermissions(Permission.CHEF_EQUIPE)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Route protégée (AdminRoute) — requiert CHEF_EQUIPE (bit 1)' })
  @ApiResponse({ status: 200, description: 'Accès accordé' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @ApiResponse({ status: 403, description: 'Droits insuffisants' })
  adminRoute(@Request() req: { user: { userId: string; username: string; permissions: number } }) {
    const { userId, username, permissions } = req.user;
    return {
      message: 'AdminRoute — accès accordé ✅',
      user: { userId, username },
      permissions: {
        value: permissions,
        binary: permissions.toString(2).padStart(4, '0'),
        joueur: !!(permissions & Permission.JOUEUR),
        chefEquipe: !!(permissions & Permission.CHEF_EQUIPE),
      },
    };
  }
}
