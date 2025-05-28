import { Controller, Post } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { NoAuth } from 'src/common/decorators';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post('latest')
  @NoAuth()
  async getCurr() {
    return await this.currencyService.manualUpdate();
  }
}
// Constructor logic if needed
