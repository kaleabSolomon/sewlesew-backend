import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampaignCount() {
    try {
      const totalCampaign = await this.prisma.campaign.count(); // Total number of posts

      const campaignStatusCount = await this.prisma.campaign.groupBy({
        by: ['status'],

        _count: {
          status: true,
        },
      });

      const totalMoneyRaised = await this.prisma.campaign.aggregate({
        _sum: {
          raisedAmount: true,
        },
      });

      const timestamp = new Date(Date.now()).toISOString();

      // Initialize counts
      let activeCampaignsCount = 0;
      let closedCampaignsCount = 0;
      let pendingCampaignsCount = 0;

      campaignStatusCount.forEach((group) => {
        if (group.status === CampaignStatus.ACTIVE) {
          activeCampaignsCount = group._count.status;
        } else if (group.status === CampaignStatus.CLOSED) {
          closedCampaignsCount = group._count.status;
        } else if (group.status === CampaignStatus.PENDING) {
          pendingCampaignsCount = group._count.status;
        }
      });
      return {
        status: 'success',
        timestamp,
        meta: {
          totalCampaign,
          statusCount: {
            activeCampaignsCount,
            closedCampaignsCount,
            pendingCampaignsCount,
          },
          totalMoneyRaised: totalMoneyRaised._sum.raisedAmount || 0,
        },
      };
    } catch {
      throw new InternalServerErrorException('something went wrong');
    }
  }
}
