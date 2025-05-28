import { Module } from '@nestjs/common';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { CurrencyService } from 'src/currency/currency.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DonationController],
  providers: [DonationService, CurrencyService],
})
export class DonationModule {}
