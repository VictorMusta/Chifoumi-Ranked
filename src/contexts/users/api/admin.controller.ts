import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  NotFoundException,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { RequiresPermissions } from '../../auth/permissions.decorator';
import { Permission } from '../../../core/user/permissions/permission';
import { TypeOrmUserRepository } from '../database/typeorm-user.repository';

class UpdatePermissionsBody {
  @ApiProperty({
    example: 2,
    description:
      'Nouvelle valeur bitmask des permissions. 0=aucun, 1=joueur, 2=chef, 3=admin',
  })
  permissions: number;
}

class AtomicPermissionBody {
  @ApiProperty({
    example: 1,
    description:
      'La permission (bit) à ajouter/retirer/toggler (ex: 1 pour JOUEUR, 2 pour CHEF_EQUIPE)',
  })
  permission: number;
}

class UserSummary {
  @ApiProperty() id: string;
  @ApiProperty() username: string;
  @ApiProperty() email: string;
  @ApiProperty() permissions: number;
  @ApiProperty() permissionsBinary: string;
}

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequiresPermissions(Permission.JOUEUR, Permission.CHEF_EQUIPE) // bit 0 ET bit 1 → uniquement valeur 3 (admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly userRepo: TypeOrmUserRepository) {}

  /** Liste tous les utilisateurs (sans le hash du mot de passe). */
  @Get('users')
  @ApiOperation({ summary: 'Lister tous les utilisateurs (admin seulement)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs',
    type: [UserSummary],
  })
  @ApiResponse({ status: 403, description: 'Droits insuffisants' })
  async getAllUsers(): Promise<UserSummary[]> {
    const users = await this.userRepo.findAll();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      permissions: u.permissions,
      permissionsBinary: u.permissions.toString(2).padStart(2, '0'),
    }));
  }

  /** Met à jour le bitmask de permissions d'un utilisateur. */
  @Patch('users/:id/permissions')
  @ApiOperation({
    summary: "Modifier les permissions d'un utilisateur (admin seulement)",
  })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Permissions mises à jour',
    type: UserSummary,
  })
  @ApiResponse({ status: 403, description: 'Droits insuffisants' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async updatePermissions(
    @Param('id') id: string,
    @Body() body: UpdatePermissionsBody,
    @Request() req: { user: { userId: string } },
  ): Promise<UserSummary> {
    // Sécurité : un admin ne peut pas se retirer ses propres droits admin
    if (id === req.user.userId && (body.permissions & 0b11) !== 0b11) {
      throw new ForbiddenException(
        'Un admin ne peut pas réduire ses propres droits admin via cette interface.',
      );
    }

    const value = Math.max(0, Math.min(3, Math.floor(body.permissions)));
    const updated = await this.userRepo.updatePermissions(id, value);
    if (!updated) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      permissions: updated.permissions,
      permissionsBinary: updated.permissions.toString(2).padStart(2, '0'),
    };
  }

  /** Ajoute une permission à un utilisateur (OR bitwise). */
  @Post('users/:id/permissions/add')
  @ApiOperation({ summary: 'Ajouter un droit spécifique (OR bitwise)' })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 200, type: UserSummary })
  async addPermission(
    @Param('id') id: string,
    @Body() body: AtomicPermissionBody,
    @Request() req: any,
  ) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.applyAndSave(id, user.permissions | body.permission, req);
  }

  /** Retire une permission à un utilisateur (AND NOT bitwise). */
  @Post('users/:id/permissions/remove')
  @ApiOperation({ summary: 'Retirer un droit spécifique (AND NOT bitwise)' })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 200, type: UserSummary })
  async removePermission(
    @Param('id') id: string,
    @Body() body: AtomicPermissionBody,
    @Request() req: any,
  ) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.applyAndSave(id, user.permissions & ~body.permission, req);
  }

  /** Bascule une permission à un utilisateur (XOR bitwise). */
  @Post('users/:id/permissions/toggle')
  @ApiOperation({
    summary: 'Basculer (toggle) un droit spécifique (XOR bitwise)',
  })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 200, type: UserSummary })
  async togglePermission(
    @Param('id') id: string,
    @Body() body: AtomicPermissionBody,
    @Request() req: any,
  ) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.applyAndSave(id, user.permissions ^ body.permission, req);
  }

  private async applyAndSave(
    id: string,
    newPermissions: number,
    req: any,
  ): Promise<UserSummary> {
    // Sécurité : protection anti-auto-rétrogradation
    if (id === req.user.userId && (newPermissions & 0b11) !== 0b11) {
      throw new ForbiddenException(
        'Anti-auto-rétrogradation : un admin doit rester admin.',
      );
    }

    const value = Math.max(0, Math.min(3, Math.floor(newPermissions)));
    const updated = await this.userRepo.updatePermissions(id, value);
    if (!updated) throw new NotFoundException('Utilisateur introuvable');

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      permissions: updated.permissions,
      permissionsBinary: updated.permissions.toString(2).padStart(2, '0'),
    };
  }
}
