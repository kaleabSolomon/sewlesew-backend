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

  async createCheckoutSession(dto: CreateStripeDonationDto, userId?: string) {
    try {
      // Generate unique transaction reference
      const txRef = uuidv4();

      // Create donation record in database
      await this.donationService.createDonation(dto, txRef, userId);

      const clientMedium = dto.medium?.toLowerCase();
      const isMobileClient = clientMedium === 'mobile';

      const frontendBaseUrl = this.configService.get<string>('FRONTEND_URL');
      const mobileAppScheme = this.configService.get<string>(
        'MOBILE_APP_SCHEME',
        'sewlesewfund', // Default to what your mobile dev provided
      );

      let successUrl: string;
      let cancelUrl: string;

      if (isMobileClient) {
        successUrl = `${mobileAppScheme}://stripe-payment-success?status=success&tx_ref=${txRef}`;
        cancelUrl = `${mobileAppScheme}://stripe-payment-cancel?status=cancelled&tx_ref=${txRef}`;
      } else {
        // Web client URLs
        successUrl = `${frontendBaseUrl}?status=success&tx_ref=${txRef}`; // Added tx_ref for consistency
        cancelUrl = `${frontendBaseUrl}?status=cancelled&tx_ref=${txRef}`; // Added tx_ref
      }

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
          userId: userId || '',
          donorFirstName: dto.donorFirstName || '',
          donorLastName: dto.donorLastName || '',
          email: dto.email || '',
          isAnonymous: dto.isAnonymous?.toString() || 'false',
        },
        customer_email: dto.email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        expand: ['payment_intent'],
      });

      let clientSecret = null;
      if (
        session.payment_intent &&
        typeof session.payment_intent !== 'string'
      ) {
        clientSecret = session.payment_intent.client_secret;
      }

      return {
        id: session.id,
        clientSecret,
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
