import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { NoAuth } from 'src/common/decorators';

@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @NoAuth()
  @Get('campaigns/count')
  async getCampaignCount() {
    return await this.statsService.getCampaignCount();
  }

  @NoAuth()
  @Get('agents')
  async getAgentStats() {
    return await this.statsService.getAgentStats();
  }
}
