import * as common from '@nestjs/common';
import { StripeService } from './stripe.service';
import { TypeOrmUserRepository } from '../users/database/typeorm-user.repository';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as express from 'express';

@common.Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly userRepo: TypeOrmUserRepository,
  ) {}

  @common.UseGuards(JwtAuthGuard)
  @common.Post('checkout')
  async createCheckout(
    @common.Req() req: any,
    @common.Body() body: { tier: 'basic' | 'pro' },
  ) {
    const user = req.user;
    const session = await this.stripeService.createCheckoutSession(
      user.userId,
      body.tier,
      user.email,
    );
    return { url: session.url };
  }

  @common.Post('webhook')
  async handleWebhook(
    @common.Req() req: common.RawBodyRequest<express.Request>,
    @common.Headers('stripe-signature') sig: string,
  ) {
    let event;
    try {
      event = this.stripeService.constructEvent(req.rawBody, sig);
    } catch (err) {
      return { status: 'failed', message: err.message };
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { userId, tier, skinId } = session.metadata as {
        userId: string;
        tier: string;
        skinId?: string;
      };

      const user = await this.userRepo.findById(userId);
      if (user) {
        if (tier === 'skin' && skinId) {
          if (!user.ownedSkinIds.includes(skinId)) {
            user.ownedSkinIds.push(skinId);
          }
        } else if (tier) {
          user.subscriptionTier =
            tier === 'pro' ? 2 : tier === 'basic' ? 1 : user.subscriptionTier;
        }
        await this.userRepo.save(user);
      }
    }

    return { received: true };
  }
}
