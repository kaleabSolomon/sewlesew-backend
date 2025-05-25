import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { createApiResponse } from 'src/utils';

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

  async getAgentStats() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const totalAgentsCount = await this.prisma.agent.count({
        where: { isDeleted: false },
      });

      const activeAgentsCount = await this.prisma.agent.count({
        where: {
          isActive: true,
          isVerified: true,
          isDeleted: false,
        },
      });

      const newAgentsTodayCount = await this.prisma.agent.count({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
          isDeleted: false,
        },
      });

      const inactiveAgentsCount = await this.prisma.agent.count({
        where: {
          isDeleted: false,
          OR: [{ isVerified: false }, { isActive: false }],
        },
      });

      const statsData = {
        totalAgents: totalAgentsCount,
        activeAgents: activeAgentsCount,
        newAgentsToday: newAgentsTodayCount,
        inactiveAgents: inactiveAgentsCount,
      };
      return createApiResponse({
        status: 'success',
        message: 'Fetched Agent Stats Successfully',
        data: statsData, // Using 'data' key for the payload
      });
    } catch (error) {
      console.error('Error fetching agent stats:', error); // It's good practice to log the actual error
      throw new InternalServerErrorException(
        'Something went wrong while fetching agent stats',
      );
    }
  }
}
