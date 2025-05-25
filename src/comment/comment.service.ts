import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/CreateComment.dto';
import { CampaignStatus } from '@prisma/client';
import { createApiResponse } from 'src/utils';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async createCampaignComment(userId: string, dto: CreateCommentDto) {
    const { campaignId, commentText, parentId } = dto;
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Could not find campaign!');
    if (campaign.status !== CampaignStatus.ACTIVE)
      throw new ForbiddenException('You can not comment on this campaign');

    try {
      const comment = await this.prisma.comment.create({
        data: { userId, campaignId, parentId: parentId ?? null, commentText },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
          campaignId: true,
          parentId: true,
          commentText: true,
          createdAt: true,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'Comment created successfully',
        data: comment,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Couldnot create comment.');
    }
  }
  async createTestimonialComment(userId: string, dto: CreateCommentDto) {
    const { testimonialId, commentText, parentId } = dto;
    const testimonial = await this.prisma.testimonial.findFirst({
      where: { id: testimonialId },
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });
    if (!testimonial)
      throw new NotFoundException('Could not find testimonial!');
    try {
      const comment = await this.prisma.comment.create({
        data: {
          userId,
          testimonialId,
          parentId: parentId ?? null,
          commentText,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'Comment created successfully',
        data: comment,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Could not create comment.');
    }
  }

  async getCampaignComments(
    campaignId: string,
    page: number = 1,
    limit: number = 10,
    parentOnly: boolean = false,
  ) {
    try {
      // Check if campaign exists
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: campaignId },
      });
      if (!campaign) throw new NotFoundException('Could not find campaign!');

      const skip = (page - 1) * limit;

      const whereClause: any = {
        campaignId,
      };

      if (parentOnly) {
        whereClause.parentId = null;
      }

      const [comments, total] = await Promise.all([
        this.prisma.comment.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.comment.count({
          where: whereClause,
        }),
      ]);

      return createApiResponse({
        status: 'success',
        message: 'Comments fetched successfully',
        data: {
          comments,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.log(err);
      throw new InternalServerErrorException('Could not fetch comments.');
    }
  }

  async getCommentReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      // Check if parent comment exists
      const parentComment = await this.prisma.comment.findFirst({
        where: { id: commentId },
      });
      if (!parentComment)
        throw new NotFoundException('Could not find comment!');

      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        this.prisma.comment.findMany({
          where: {
            parentId: commentId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc', // Replies ordered chronologically
          },
          skip,
          take: limit,
        }),
        this.prisma.comment.count({
          where: {
            parentId: commentId,
          },
        }),
      ]);

      return createApiResponse({
        status: 'success',
        message: 'Replies fetched successfully',
        data: {
          comments,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.log(err);
      throw new InternalServerErrorException('Could not fetch replies.');
    }
  }

  async getTestimonialComments(
    testimonialId: string,
    page: number = 1,
    limit: number = 10,
    parentOnly: boolean = false,
  ) {
    try {
      // Check if testimonial exists
      const testimonial = await this.prisma.testimonial.findFirst({
        where: { id: testimonialId },
      });
      if (!testimonial)
        throw new NotFoundException('Could not find testimonial!');

      const skip = (page - 1) * limit;

      const whereClause: any = {
        testimonialId,
      };

      if (parentOnly) {
        whereClause.parentId = null;
      }

      const [comments, total] = await Promise.all([
        this.prisma.comment.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.comment.count({
          where: whereClause,
        }),
      ]);

      return createApiResponse({
        status: 'success',
        message: 'Comments fetched successfully',
        data: {
          comments,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.log(err);
      throw new InternalServerErrorException('Could not fetch comments.');
    }
  }
}
