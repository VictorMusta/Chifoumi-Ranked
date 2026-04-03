import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
        'sk_test_placeholder',
      {
        apiVersion: '2026-03-25.dahlia' as any,
      },
    );
  }

  async ensureProductAndPrice() {
    const existingPriceId = this.configService.get<string>(
      'STRIPE_PRO_PRICE_ID',
    );
    if (existingPriceId && existingPriceId.startsWith('price_')) {
      return existingPriceId;
    }

    // Create a product and price as per blueprint
    const product = await this.stripe.products.create({
      name: 'Chifoumi PRO Upgrade',
      description: "Débloquez la pierre à l'infini !",
    });

    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: 500, // 5.00 EUR
      currency: 'eur',
    });

    return price.id;
  }

  async createCheckoutSession(
    userId: string,
    tier: 'basic' | 'pro' | 'skin',
    email: string,
    priceIdOverride?: string,
    skinId?: string,
  ) {
    let priceId =
      priceIdOverride || this.configService.get<string>('STRIPE_PRO_PRICE_ID');
    console.log('Current priceId for checkout:', priceId);

    // If not configured properly (missing or not a price_ ID), and not a skin purchase, auto-create pro price
    if (tier !== 'skin' && (!priceId || !priceId.startsWith('price_'))) {
      console.log('Invalid or missing Price ID for Pro, ensuring new one...');
      priceId = await this.ensureProductAndPrice();
      console.log('Ensured Price ID:', priceId);
    }

    if (!priceId) throw new Error('No Price ID provided for Checkout');

    // Fetch the price to determine the correct mode automatically
    const price = await this.stripe.prices.retrieve(priceId);
    const mode =
      price.type === 'recurring' || price.recurring
        ? 'subscription'
        : 'payment';
    console.log(`Setting Checkout mode to: ${mode} for price: ${priceId}`);

    try {
      return await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: mode as any,
        success_url: `${this.configService.get('APP_URL', 'http://localhost:6969')}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('APP_URL', 'http://localhost:6969')}/cancel.html`,
        client_reference_id: userId,
        metadata: { userId, tier, skinId: skinId || '' },
      });
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      throw error;
    }
  }

  async createProductAndPrice(
    name: string,
    priceInCents: number,
    color: string,
  ) {
    try {
      const product = await this.stripe.products.create({
        name: `Skin: ${name}`,
        description: `Un skin exclusif de couleur ${color}`,
        metadata: {
          type: 'skin',
          color,
        },
      });

      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: priceInCents,
        currency: 'eur',
      });

      return {
        productId: product.id,
        priceId: price.id,
      };
    } catch (error) {
      console.error('Stripe Product Creation Error:', error);
      throw error;
    }
  }

  constructEvent(payload: any, sig: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      'whsec_placeholder',
    );
    return this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  }
}
