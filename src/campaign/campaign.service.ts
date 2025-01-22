import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateBusinessCampaignDto,
  CreateOrganizationalCharityCampaignDto,
} from './dto';
import { Doc, Image } from 'src/common/types';
import { Category } from '@prisma/client';
import { createApiResponse } from 'src/utils';

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
    try {
      const campaignExists = await this.checkCampaignExists(
        dto.tinNumber,
        dto.licenseNumber,
      );
      if (campaignExists)
        throw new ConflictException(
          'This Business or Charity is Already Registered. ',
        );

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
            businessId: charity.id,
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

      const createdCampaign = await this.prisma.campaign.findFirst({
        where: { id: campaign.id },
        include: {
          user: {
            select: {},
          },
          charity: true,
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
