import { Module } from '@nestjs/common';
import { CampaignSchedulerService } from './campaignScheduler.service';
import { CampaignSchedulerController } from './campaignScheduler.controller';

@Module({
  providers: [CampaignSchedulerService],
  controllers: [CampaignSchedulerController],
  exports: [CampaignSchedulerService],
})
export class CampaignSchedulerModule {}
