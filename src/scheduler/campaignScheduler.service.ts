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

      const updatedCampaigns = await this.prisma.campaign.findMany({
        where: {
          deadline: { lte: now },
          status: CampaignStatus.CLOSED, // Now, we're fetching the ones that were closed
        },
      });

      for (const campaign of updatedCampaigns) {
        const existingClosedCampaign =
          await this.prisma.closedCampaign.findFirst({
            where: { campaignId: campaign.id },
          });

        if (!existingClosedCampaign) {
          await this.prisma.closedCampaign.create({
            data: {
              campaignId: campaign.id,
              reason: 'Deadline met',
              isCompleted: false,
            },
          });
          this.logger.log(`Campaign ${campaign.id} added to closedCampaigns.`);
        } else {
          this.logger.log(
            `Campaign ${campaign.id} already exists in closedCampaigns.`,
          );
        }
      }
      if (result.count > 0) {
        console.log(result);
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
