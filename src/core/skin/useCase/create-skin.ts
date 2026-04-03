import { Injectable } from '@nestjs/common';
import { TypeOrmSkinRepository } from '../../../contexts/skins/database/typeorm-skin.repository';
import { StripeService } from '../../../contexts/stripe/stripe.service';
import { Skin } from '../entity/skin';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateSkinUseCase {
  constructor(
    private readonly skinRepository: TypeOrmSkinRepository,
    private readonly stripeService: StripeService,
  ) {}

  async execute(name: string, price: number, color: string): Promise<Skin> {
    // 1. Create in Stripe
    const { productId, priceId } = await this.stripeService.createProductAndPrice(
      name,
      price,
      color,
    );

    // 2. Save in Database
    const skin = new Skin(
      uuidv4(),
      name,
      productId,
      priceId,
      price,
      color,
    );

    await this.skinRepository.save(skin);
    return skin;
  }
}
