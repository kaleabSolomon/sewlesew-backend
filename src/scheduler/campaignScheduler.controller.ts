import { Controller, Post } from '@nestjs/common';
import { CampaignSchedulerService } from './campaignScheduler.service';
import { NoAuth } from 'src/common/decorators';

@Controller('scheduler')
export class CampaignSchedulerController {
  constructor(private readonly schedulerService: CampaignSchedulerService) {}

  @NoAuth()
  @Post('close-campaigns')
  async triggerManualCampaignClose() {
    await this.schedulerService.handleCampaignDeadlines();
    return { message: 'Campaign closure check triggered manually.' };
  }
}
