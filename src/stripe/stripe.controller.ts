import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { GetCurrentUser, NoAuth } from 'src/common/decorators';
import { CreateStripeDonationDto } from 'src/donation/dto';
import { OptionalAuth } from 'src/common/decorators/optionalAuth.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @OptionalAuth()
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() dto: CreateStripeDonationDto,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.stripeService.createCheckoutSession(dto, userId);
  }

  @NoAuth()
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    return this.stripeService.handleWebhook(req);
  }
}
