import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { HttpModule } from '@nestjs/axios';
import { CurrencyController } from './currency.controller';

@Module({
  imports: [HttpModule],
  providers: [CurrencyService],
  exports: [CurrencyService],
  controllers: [CurrencyController],
})
export class CurrencyModule {}
