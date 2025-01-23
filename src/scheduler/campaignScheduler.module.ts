import { Module } from '@nestjs/common';
import { CampaignSchedulerService } from './campaignScheduler.service';

@Module({
  providers: [CampaignSchedulerService],
  exports: [CampaignSchedulerService],
})
export class CampaignSchedulerModule {}
