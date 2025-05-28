import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { NoAuth } from 'src/common/decorators';
import { CreateStripeDonationDto } from 'src/donation/dto';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @NoAuth()
  @Post('create-checkout-session')
  async createCheckoutSession(@Body() dto: CreateStripeDonationDto) {
    return this.stripeService.createCheckoutSession(dto);
  }

  @NoAuth()
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    return this.stripeService.handleWebhook(req);
  }
}
