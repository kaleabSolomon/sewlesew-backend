import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { DonationService } from '../donation/donation.service';
import { STRIPE_CLIENT } from './constants';

@Module({})
export class StripeModule {
  static forRootAsync(): DynamicModule {
    return {
      module: StripeModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: STRIPE_CLIENT,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return new Stripe(configService.get<string>('STRIPE_SECRET_KEY'), {
              apiVersion: '2025-04-30.basil',
            });
          },
        },
        StripeService,
        DonationService,
      ],
      controllers: [StripeController],
      exports: [STRIPE_CLIENT, StripeService],
    };
  }
}
