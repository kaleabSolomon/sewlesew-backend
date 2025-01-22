import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessCampaignDto } from './dto';
import { Doc, Image } from 'src/common/types';
import { CampaignStatus, Category } from '@prisma/client';
import { createApiResponse } from 'src/utils';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async createBusinessCampaign(
    userId: string,
    dto: CreateBusinessCampaignDto,
    images: Image[],
    docs: Doc[],
  ) {
    try {
      const { tinNumber, licenseNumber } = dto;

      const campaignExists = await this.prisma.campaign.findFirst({
        where: {
          status: CampaignStatus.ACTIVE,
          OR: [
            {
              business: {
                tinNumber,
              },
            },
            {
              business: {
                licenseNumber,
              },
            },
            {
              charity: {
                tinNumber,
              },
            },
            {
              charity: {
                licenseNumber,
              },
            },
          ],
        },
        include: {
          business: true,
          charity: true,
        },
      });

      if (!!campaignExists)
        throw new ConflictException(
          'This Business or Charity is Already Registered. ',
        );

      const business = await this.prisma.business.create({
        data: {
          fullName: dto.fullName,
          website: dto.website,
          sector: dto.sector,
          tinNumber,
          licenseNumber,
          publicEmail: dto.publicEmail,
          publicPhoneNumber: dto.publicPhoneNumber,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhoneNumber,
          region: dto.region,
          city: dto.city,
          relativeLocation: dto.relativeLocation,
        },
      });

      if (!business)
        throw new InternalServerErrorException(
          'Couldnot register business. Please try again!',
        );

      if (docs) {
        await this.prisma.campaignDoc.createMany({
          data: docs.map((doc) => ({
            businessId: business.id,
            url: doc.url,
            docType: doc.docType,
          })),
        });
      }

      const campaign = await this.prisma.campaign.create({
        data: {
          userId,
          title: dto.title,
          description: dto.deadline,
          goalAmount: dto.goalAmount,
          deadline: dto.deadline,
          category: dto.category as Category,
        },
      });

      if (!campaign)
        throw new InternalServerErrorException(
          'Couldnot create campaign. Please try again!',
        );

      if (images) {
        await this.prisma.campaignMedia.createMany({
          data: images.map((image) => ({
            campaignId: campaign.id,
            url: image.url,
            imageType: image.imgType,
          })),
        });
      }

      const createdCampaign = await this.prisma.campaign.findFirst({
        where: { id: campaign.id },
        include: {
          user: true,
          business: true,
          campaignMedia: true,
        },
      });

      return createApiResponse({
        status: 'success',
        message:
          'campaign creaed successfully. please wait untill the review process is done',
        data: createdCampaign,
      });
    } catch (err) {
      console.log(err);
    }
  }
}
