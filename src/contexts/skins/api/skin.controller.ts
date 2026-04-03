import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';
import { CreateSkinUseCase } from '../../../core/skin/useCase/create-skin';
import { TypeOrmSkinRepository } from '../database/typeorm-skin.repository';
import { TypeOrmUserRepository } from '../../users/database/typeorm-user.repository';
import { StripeService } from '../../stripe/stripe.service';
import { Skin } from '../../../core/skin/entity/skin';

@Controller('skins')
export class SkinController {
  constructor(
    private readonly createSkinUseCase: CreateSkinUseCase,
    private readonly skinRepo: TypeOrmSkinRepository,
    private readonly userRepo: TypeOrmUserRepository,
    private readonly stripeService: StripeService,
  ) {}

  @Get()
  async getAllSkins() {
    const dbSkins = await this.skinRepo.findAll();
    return [Skin.getDefault(), ...dbSkins];
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/create')
  async createSkin(
    @Body() body: { name: string; price: number; color: string },
  ) {
    return this.createSkinUseCase.execute(body.name, body.price, body.color);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/apply')
  async applySkin(
    @Req() req: { user: { userId: string } },
    @Param('id') skinId: string,
  ) {
    const user = await this.userRepo.findById(req.user.userId);
    if (!user) throw new ForbiddenException('User not found');

    // Check if user owns the skin (or if it's a default free one)
    const isDefault = skinId === Skin.DEFAULT_SKIN_ID;
    if (!isDefault && !user.ownedSkinIds.includes(skinId)) {
      throw new ForbiddenException("You don't own this skin");
    }

    user.activeSkinId = skinId;
    await this.userRepo.save(user);
    return { success: true, activeSkinId: skinId };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/buy')
  async buySkin(
    @Req() req: { user: { userId: string; email: string } },
    @Param('id') id: string,
  ) {
    const skin = await this.skinRepo.findById(id);
    if (!skin) throw new NotFoundException('Skin not found');

    const session = await this.stripeService.createCheckoutSession(
      req.user.userId,
      'skin',
      req.user.email,
      skin.priceId ?? undefined,
      skin.id,
    );

    return { url: session.url };
  }
}
