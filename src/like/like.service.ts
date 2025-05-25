import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createApiResponse } from 'src/utils';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}

  async toggleCampaignLike(userId: string, campaignId: string) {
    const existingLike = await this.prisma.like.findFirst({
      where: { userId, campaignId },
    });
    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      return createApiResponse({
        status: 'success',
        message: 'Like removed successfully',
        data: {},
      });
    } else {
      await this.prisma.like.create({
        data: { userId, campaignId },
      });

      return createApiResponse({
        status: 'success',
        message: 'Like added successfully',
        data: {},
      });
    }
  }
  async toggleStoryLike(userId: string, storyId: string) {
    const existingLike = await this.prisma.like.findFirst({
      where: { userId, testimonialId: storyId },
    });
    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      return createApiResponse({
        status: 'success',
        message: 'Like removed successfully',
        data: {},
      });
    } else {
      await this.prisma.like.create({
        data: { userId, testimonialId: storyId },
      });

      return createApiResponse({
        status: 'success',
        message: 'Like added successfully',
        data: {},
      });
    }
  }
}
