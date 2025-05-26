import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTestimonialDto } from './dto/createTestimonial.dto';
import { createApiResponse } from 'src/utils';
import Fuse from 'fuse.js';

@Injectable()
export class TestimonialService {
  constructor(private prisma: PrismaService) {}
  async createTestimonial(
    userId: string,
    dto: CreateTestimonialDto,
    coverImage: string,
  ) {
    const { campaignId } = dto;

    const closedCampaign = await this.prisma.closedCampaign.findFirst({
      where: { campaignId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            goalAmount: true,
            raisedAmount: true,
          },
        },
      },
    });

    if (!closedCampaign)
      throw new ForbiddenException(
        'can not write a testimonial if case is not resolved',
      );

    const testimonial = await this.prisma.testimonial.findFirst({
      where: { closedCampaignId: closedCampaign.id },
    });

    if (testimonial) {
      throw new ConflictException(
        'A testimonial Already exists for this campaign',
      );
    }

    try {
      const testimonial = await this.prisma.testimonial.create({
        data: {
          userId,
          closedCampaignId: closedCampaign.id,
          title: dto.title,
          content: dto.content,
          coverImageUrl: coverImage,
        },
      });
      return createApiResponse({
        status: 'success',
        message: 'Testimonial created successfully',
        data: testimonial,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        "Something Went Wrong, Couldn't create Testimonial",
      );
    }
  }

  async getTestimonials(
    userId: string,
    page: number,
    limit: number,
    filters: any,
  ) {
    const { title } = filters;

    const skip = (page - 1) * limit;

    try {
      const testimonials = await this.prisma.testimonial.findMany({
        take: limit,
        skip,
        include: {
          closedCampaign: {
            include: {
              campaign: {
                select: {
                  id: true,
                  title: true,
                  goalAmount: true,
                  raisedAmount: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
          likes: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      let data = testimonials;
      if (title) {
        const fuse = new Fuse(testimonials, {
          keys: ['title'],
          threshold: 0.3,
        });

        const result = fuse.search(title);
        data = result.map((r) => r.item);
      }

      const testimonialsWithLikes = data.map((testimonial) => ({
        ...testimonial,
        isLikedByUser: testimonial.likes.length > 0,
        likes: undefined, // Remove the like array from response
      }));

      return createApiResponse({
        status: 'success',
        message: 'Testimonials fetched successfully',
        data: testimonialsWithLikes,
        metadata: {
          page,
          pageSize: limit,
          totalRecords: testimonials.length,
        },
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        "something went wrong. couldn't get stories",
      );
    }
  }
}
