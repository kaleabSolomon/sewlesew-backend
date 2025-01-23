import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateBusinessCampaignDto,
  CreateOrganizationalCharityCampaignDto,
  CreatePersonalCharityCampaignDto,
} from './dto';
import { Doc, Image } from 'src/common/types';
import { CampaignStatus, Category, ImageType } from '@prisma/client';
import { createApiResponse } from 'src/utils';
import { filter } from 'rxjs';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}
  returnableFieldsUser = {
    id: true,
    email: true,
    phoneNumber: true,
    createdAt: true,
    updatedAt: true,
    isActive: true,
    role: true,
    isVerified: true,
    dateOfBirth: true,
    firstName: true,
    lastName: true,
    profilePicture: true,
  };

  async checkCampaignExists(tinNumber: string, licenseNumber: string) {
    return !!(await this.prisma.campaign.findFirst({
      where: {
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
    }));
  }

  async checkPersonalCampaignExists(id: string) {
    return !!(await this.prisma.campaign.findFirst({
      where: {
        userId: id,
        OR: [
          { status: CampaignStatus.ACTIVE },
          { status: CampaignStatus.PENDING },
        ],
      },
    }));
  }

  async createBusinessCampaign(
    userId: string,
    dto: CreateBusinessCampaignDto,
    images: Image[],
    docs: Doc[],
  ) {
    dto.deadline = moment(dto.deadline).toISOString();
    try {
      const business = await this.prisma.business.create({
        data: {
          fullName: dto.fullName,
          website: dto.website,
          sector: dto.sector,
          tinNumber: dto.tinNumber,
          licenseNumber: dto.licenseNumber,
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
          businessId: business.id,
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

      const bankDetail = await this.prisma.bankDetail.create({
        data: {
          holderName: dto.holderName,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          campaignId: campaign.id,
        },
      });

      if (!bankDetail)
        throw new InternalServerErrorException('couldnot add bank details.');

      const createdCampaign = await this.prisma.campaign.findFirst({
        where: { id: campaign.id },
        include: {
          user: {
            select: this.returnableFieldsUser,
          },
          business: true,
          campaignMedia: true,
          BankDetail: true,
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

  async createOrganizationalCharityCampaign(
    userId: string,
    dto: CreateOrganizationalCharityCampaignDto,
    images: Image[],
    docs: Doc[],
  ) {
    dto.deadline = moment(dto.deadline).toISOString();

    try {
      const charity = await this.prisma.charity.create({
        data: {
          fullName: dto.fullName,
          isOrganization: dto.isOrganization,
          website: dto.website,
          tinNumber: dto.tinNumber,
          licenseNumber: dto.licenseNumber,
          publicEmail: dto.publicEmail,
          publicPhoneNumber: dto.publicPhoneNumber,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhoneNumber,
          region: dto.region,
          city: dto.city,
          relativeLocation: dto.relativeLocation,
        },
      });

      if (!charity)
        throw new InternalServerErrorException(
          'Couldnot register charity. Please try again!',
        );

      if (docs) {
        await this.prisma.campaignDoc.createMany({
          data: docs.map((doc) => ({
            charityId: charity.id,
            url: doc.url,
            docType: doc.docType,
          })),
        });
      }

      const campaign = await this.prisma.campaign.create({
        data: {
          userId,
          charityId: charity.id,
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

      const bankDetail = await this.prisma.bankDetail.create({
        data: {
          holderName: dto.holderName,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          campaignId: campaign.id,
        },
      });

      if (!bankDetail)
        throw new InternalServerErrorException('couldnot add bank details.');

      const createdCampaign = await this.prisma.campaign.findFirst({
        where: { id: campaign.id },
        include: {
          user: {
            select: this.returnableFieldsUser,
          },
          charity: true,
          campaignMedia: true,
          BankDetail: true,
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

  async createPersonalCharityCampaign(
    userId: string,
    dto: CreatePersonalCharityCampaignDto,
    images: Image[],
    docs: Doc[],
  ) {
    dto.deadline = moment(dto.deadline).toISOString();

    try {
      const charity = await this.prisma.charity.create({
        data: {
          fullName: dto.fullName,
          isOrganization: dto.isOrganization,
          publicEmail: dto.publicEmail,
          publicPhoneNumber: dto.publicPhoneNumber,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhoneNumber,
          region: dto.region,
          city: dto.city,
          relativeLocation: dto.relativeLocation,
        },
      });

      if (!charity)
        throw new InternalServerErrorException(
          'Couldnot register cause. Please try again!',
        );

      if (docs) {
        await this.prisma.campaignDoc.createMany({
          data: docs.map((doc) => ({
            charityId: charity.id,
            url: doc.url,
            docType: doc.docType,
          })),
        });
      }

      const campaign = await this.prisma.campaign.create({
        data: {
          userId,
          charityId: charity.id,
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

      const bankDetail = await this.prisma.bankDetail.create({
        data: {
          holderName: dto.holderName,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          campaignId: campaign.id,
        },
      });

      if (!bankDetail)
        throw new InternalServerErrorException('couldnot add bank details.');

      const createdCampaign = await this.prisma.campaign.findFirst({
        where: { id: campaign.id },
        include: {
          user: {
            select: this.returnableFieldsUser,
          },
          charity: true,
          campaignMedia: true,
          BankDetail: true,
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
  async getCampaigns(
    page: number,
    limit: number,
    filters: { category?: Category; fullName?: string },
  ) {
    try {
      const skip = (page - 1) * limit;
      const take = limit;

      const campaigns = await this.prisma.campaign.findMany({
        where: {
          category: filters.category,
          status: { not: CampaignStatus.PENDING },
          OR: [
            {
              business: {
                fullName: {
                  contains: filters.fullName,
                  // search: filters.fullName,
                },
              },
            },
            {
              charity: {
                fullName: {
                  contains: filters.fullName,
                },
              },
            },
          ],
        },
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,

          goalAmount: true,
          raisedAmount: true,
          category: true,
          deadline: true,
          status: true,

          campaignMedia: {
            where: {
              imageType: ImageType.COVER_IMAGE,
            },
            select: {
              id: true,
              url: true,
            },
          },
        },
      });

      if (!campaigns)
        throw new InternalServerErrorException('Unable to get Campaigns. ');
      const totalItems = await this.prisma.campaign.count({
        where: {
          category: filters.category,
          status: { not: CampaignStatus.PENDING },
          OR: [
            {
              business: {
                fullName: {
                  contains: filters.fullName,
                  // search: filters.fullName,
                },
              },
            },
            {
              charity: {
                fullName: {
                  contains: filters.fullName,
                },
              },
            },
          ],
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'Fetched campaigns successfully',
        data: campaigns,
        metadata: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          pageSize: limit,
          currentPage: page,
        },
      });
    } catch (err) {
      console.log(err);
    }
  }
}
