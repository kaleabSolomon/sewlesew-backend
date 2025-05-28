import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface CurrencyApiResponse {
  meta: {
    last_updated_at: string;
  };
  data: {
    ETB: {
      code: string;
      value: number;
    };
    USD: {
      code: string;
      value: number;
    };
  };
}

@Injectable()
export class CurrencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService, // Assuming you have a ConfigService for environment variables
  ) {}

  private readonly logger = new Logger(CurrencyService.name);
  private readonly apiUrl = `https://api.currencyapi.com/v3/latest?apikey=${this.config.get('CURRENCY_API_KEY')}&currencies=USD%2CETB`;
  // Run every day at 2:00 AM UTC
  @Cron('0 2 * * *', {
    name: 'updateCurrencyRates',
    timeZone: 'UTC',
  })
  async updateCurrencyRates(): Promise<void> {
    this.logger.log('Starting daily currency rates update...');

    try {
      // Fetch currency data from API
      const response = await firstValueFrom(
        this.httpService.get<CurrencyApiResponse>(this.apiUrl),
      );

      const { data: currencyData } = response.data;

      // Delete existing currency data
      await this.prisma.currency.deleteMany();

      // Insert new currency data
      const newCurrencyRecord = await this.prisma.currency.create({
        data: {
          etbValue: currencyData.ETB.value,
          usdValue: currencyData.USD.value,
        },
      });

      this.logger.log(
        `Currency rates updated successfully: ETB=${newCurrencyRecord.etbValue}, USD=${newCurrencyRecord.usdValue}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to update currency rates',
        error.stack || error.message,
      );
    }
  }

  // Method to get current currency rates
  async getCurrentRates() {
    const currency = await this.prisma.currency.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!currency) {
      throw new Error('No currency data available');
    }

    return currency;
  }

  // Method to convert USD to ETBetbValue
  async convertUsdToEtb(usdAmount: number): Promise<number> {
    const rates = await this.getCurrentRates();
    return usdAmount * rates.etbValue;
  }

  // Method to convert ETB to USD
  async convertEtbToUsd(etbAmount: number): Promise<number> {
    const rates = await this.getCurrentRates();
    return etbAmount / rates.etbValue;
  }

  // Manual trigger for testing purposes
  async manualUpdate(): Promise<void> {
    await this.updateCurrencyRates();
  }
}
