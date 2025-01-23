import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Runs every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleCampaignDeadlines() {
    const now = new Date();

    try {
      const result = await this.prisma.campaign.updateMany({
        where: {
          deadline: { lte: now }, // Deadline is less than or equal to the current time
          status: CampaignStatus.ACTIVE, // Only update active campaigns
        },
        data: { status: CampaignStatus.CLOSED },
      });

      if (result.count > 0) {
        this.logger.log(
          `Closed ${result.count} campaign(s) whose deadline has passed.`,
        );
      } else {
        this.logger.log('No campaigns to close at this time.');
      }
    } catch (error) {
      this.logger.error(
        'Failed to close campaigns automatically.',
        error.stack,
      );
    }
  }
}
