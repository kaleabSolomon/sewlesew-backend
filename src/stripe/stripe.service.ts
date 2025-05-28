import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request } from 'express';
import { DonationService } from '../donation/donation.service';
import { PaymentStatus } from '@prisma/client';
import { STRIPE_CLIENT } from './constants';
import { CreateStripeDonationDto } from 'src/donation/dto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private donationService: DonationService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async createCheckoutSession(dto: CreateStripeDonationDto) {
    try {
      // Generate unique transaction reference
      const txRef = uuidv4();

      // Create donation record in database
      await this.donationService.createDonation(dto, txRef);

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment', // One-time payment for donations
        line_items: [
          {
            price_data: {
              currency: 'usd', // Change to your preferred currency
              product_data: {
                name: 'Donation',
                description: `Donation for campaign`,
              },
              unit_amount: Math.round(dto.amount * 100), // Amount in cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          txRef,
          campaignId: dto.campaignId,
          userId: dto.userId || '',
          donorFirstName: dto.donorFirstName || '',
          donorLastName: dto.donorLastName || '',
          email: dto.email || '',
          isAnonymous: dto.isAnonymous?.toString() || 'false',
        },
        customer_email: dto.email,
        success_url: `${this.configService.get('FRONTEND_URL')}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/donation/cancel`,
      });

      return {
        id: session.id,
        url: session.url,
        txRef,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new InternalServerErrorException(`Stripe Error: ${error.message}`);
    }
  }

  async handleWebhook(req: Request) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    const signature = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed.', err.message);
      throw new Error('Webhook signature verification failed.');
    }

    console.log('checked header, constructed event:', event);
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new InternalServerErrorException('Error processing webhook');
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const txRef = session.metadata?.txRef;

    if (txRef) {
      const campaign = await this.donationService.finalizeDonation(
        txRef,
        PaymentStatus.VERIFIED,
        'USD',
      );

      console.log(`✅ Donation completed for txRef: ${txRef}`);
      return campaign;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log(`❌ Payment failed: ${paymentIntent.id}`);
  }
}
