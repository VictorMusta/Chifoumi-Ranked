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
    tier: 'basic' | 'pro',
    email: string,
  ) {
    let priceId = this.configService.get<string>('STRIPE_PRO_PRICE_ID');
    console.log('Current STRIPE_PRO_PRICE_ID from config:', priceId);

    // If not configured properly (missing or not a price_ ID), auto-create one
    if (!priceId || !priceId.startsWith('price_')) {
      console.log('Invalid or missing Price ID, ensuring new one...');
      priceId = await this.ensureProductAndPrice();
      console.log('Ensured Price ID:', priceId);
    }

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
        metadata: { userId, tier },
      });
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
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
