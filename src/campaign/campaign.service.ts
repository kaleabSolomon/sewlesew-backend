import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateBusinessCampaignDto,
  CreateOrganizationalCharityCampaignDto,
  CreatePersonalCharityCampaignDto,
} from './dto';
import { Doc, Image, userReq } from 'src/common/types';
import {
  CampaignStatus,
  Category,
  ImageType,
  PaymentStatus,
} from '@prisma/client';
import { createApiResponse } from 'src/utils';
import { AuthService } from 'src/auth/auth.service';
import { SmsService } from 'src/sms/sms.service';
import { CloseCampaignDto } from './dto/closeCampaign.dto';
import { AddCampaignUpdateDto } from './dto/addCampaignUpdate.dto';

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private smsService: SmsService,
  ) {}
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
      const result = await this.prisma.$transaction(async (prisma) => {
        const business = await prisma.business.create({
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
            country: dto.country,
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
          await prisma.campaignDoc.createMany({
            data: docs.map((doc) => ({
              businessId: business.id,
              url: doc.url,
              docType: doc.docType,
            })),
          });
        }

        const campaign = await prisma.campaign.create({
          data: {
            userId,
            businessId: business.id,
            title: dto.title,
            description: dto.description,
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
          await prisma.campaignMedia.createMany({
            data: images.map((image) => ({
              campaignId: campaign.id,
              url: image.url,
              imageType: image.imgType,
            })),
          });
        }

        const bankDetail = await prisma.bankDetail.create({
          data: {
            holderName: dto.holderName,
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            campaignId: campaign.id,
          },
        });

        if (!bankDetail)
          throw new InternalServerErrorException('couldnot add bank details.');

        const createdCampaign = await prisma.campaign.findFirst({
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
        return createdCampaign;
      });

      return createApiResponse({
        status: 'success',
        message:
          'campaign creaed successfully. please wait untill the review process is done',
        data: result,
      });
    } catch (err) {
      console.log(err);
    }
  }
  async createBusinessCampaignAgent(
    agentId: string,
    dto: CreateBusinessCampaignDto,
    images: Image[],
    docs: Doc[],
  ) {
    dto.deadline = moment(dto.deadline).toISOString();
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const business = await prisma.business.create({
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
            country: dto.country,
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
          await prisma.campaignDoc.createMany({
            data: docs.map((doc) => ({
              businessId: business.id,
              url: doc.url,
              docType: doc.docType,
            })),
          });
        }

        const campaign = await prisma.campaign.create({
          data: {
            agentId: agentId,
            businessId: business.id,
            title: dto.title,
            description: dto.description,
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
          await prisma.campaignMedia.createMany({
            data: images.map((image) => ({
              campaignId: campaign.id,
              url: image.url,
              imageType: image.imgType,
            })),
          });
        }

        const bankDetail = await prisma.bankDetail.create({
          data: {
            holderName: dto.holderName,
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            campaignId: campaign.id,
          },
        });

        if (!bankDetail)
          throw new InternalServerErrorException('couldnot add bank details.');

        const createdCampaign = await prisma.campaign.findFirst({
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
        return createdCampaign;
      });

      return createApiResponse({
        status: 'success',
        message:
          'campaign creaed successfully. please wait untill the review process is done',
        data: result,
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
      const result = await this.prisma.$transaction(async (prisma) => {
        const charity = await prisma.charity.create({
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
            country: dto.country,
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
          await prisma.campaignDoc.createMany({
            data: docs.map((doc) => ({
              charityId: charity.id,
              url: doc.url,
              docType: doc.docType,
            })),
          });
        }

        const campaign = await prisma.campaign.create({
          data: {
            userId,
            charityId: charity.id,
            title: dto.title,
            description: dto.description,
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
          await prisma.campaignMedia.createMany({
            data: images.map((image) => ({
              campaignId: campaign.id,
              url: image.url,
              imageType: image.imgType,
            })),
          });
        }

        const bankDetail = await prisma.bankDetail.create({
          data: {
            holderName: dto.holderName,
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            campaignId: campaign.id,
          },
        });

        if (!bankDetail)
          throw new InternalServerErrorException('couldnot add bank details.');

        const createdCampaign = await prisma.campaign.findFirst({
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

        return createdCampaign;
      });

      return createApiResponse({
        status: 'success',
        message:
          'campaign creaed successfully. please wait untill the review process is done',
        data: result,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async createOrganizationalCharityCampaignAgent(
    agentId: string,
    dto: CreateOrganizationalCharityCampaignDto,
    images: Image[],
    docs: Doc[],
  ) {
    dto.deadline = moment(dto.deadline).toISOString();

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const charity = await prisma.charity.create({
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
            country: dto.country,
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
          await prisma.campaignDoc.createMany({
            data: docs.map((doc) => ({
              charityId: charity.id,
              url: doc.url,
              docType: doc.docType,
            })),
          });
        }

        const campaign = await prisma.campaign.create({
          data: {
            agentId: agentId,
            charityId: charity.id,
            title: dto.title,
            description: dto.description,
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
          await prisma.campaignMedia.createMany({
            data: images.map((image) => ({
              campaignId: campaign.id,
              url: image.url,
              imageType: image.imgType,
            })),
          });
        }

        const bankDetail = await prisma.bankDetail.create({
          data: {
            holderName: dto.holderName,
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            campaignId: campaign.id,
          },
        });

        if (!bankDetail)
          throw new InternalServerErrorException('couldnot add bank details.');

        const createdCampaign = await prisma.campaign.findFirst({
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

        return createdCampaign;
      });

      return createApiResponse({
        status: 'success',
        message:
          'campaign creaed successfully. please wait untill the review process is done',
        data: result,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
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
      const result = await this.prisma.$transaction(async (prisma) => {
        const charity = await prisma.charity.create({
          data: {
            fullName: dto.fullName,
            isOrganization: dto.isOrganization,
            publicEmail: dto.publicEmail,
            publicPhoneNumber: dto.publicPhoneNumber,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhoneNumber,
            country: dto.country,
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
          await prisma.campaignDoc.createMany({
            data: docs.map((doc) => ({
              charityId: charity.id,
              url: doc.url,
              docType: doc.docType,
            })),
          });
        }

        const campaign = await prisma.campaign.create({
          data: {
            userId,
            charityId: charity.id,
            title: dto.title,
            description: dto.description,
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
          await prisma.campaignMedia.createMany({
            data: images.map((image) => ({
              campaignId: campaign.id,
              url: image.url,
              imageType: image.imgType,
            })),
          });
        }

        const bankDetail = await prisma.bankDetail.create({
          data: {
            holderName: dto.holderName,
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            campaignId: campaign.id,
          },
        });

        if (!bankDetail)
          throw new InternalServerErrorException('couldnot add bank details.');

        const createdCampaign = await prisma.campaign.findFirst({
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
        return createdCampaign;
      });

      return createApiResponse({
        status: 'success',
        message:
          'campaign creaed successfully. please wait untill the review process is done',
        data: result,
      });
    } catch (err) {
      console.log(err);
    }
  }
  async createPersonalCharityCampaignAgent(
    agentId: string,
    dto: CreatePersonalCharityCampaignDto,
    images: Image[],
    docs: Doc[],
  ) {
    dto.deadline = moment(dto.deadline).toISOString();

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const charity = await prisma.charity.create({
          data: {
            fullName: dto.fullName,
            isOrganization: dto.isOrganization,
            publicEmail: dto.publicEmail,
            publicPhoneNumber: dto.publicPhoneNumber,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhoneNumber,
            country: dto.country,
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
          await prisma.campaignDoc.createMany({
            data: docs.map((doc) => ({
              charityId: charity.id,
              url: doc.url,
              docType: doc.docType,
            })),
          });
        }

        const campaign = await prisma.campaign.create({
          data: {
            agentId: agentId,
            charityId: charity.id,
            title: dto.title,
            description: dto.description,
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
          await prisma.campaignMedia.createMany({
            data: images.map((image) => ({
              campaignId: campaign.id,
              url: image.url,
              imageType: image.imgType,
            })),
          });
        }

        const bankDetail = await prisma.bankDetail.create({
          data: {
            holderName: dto.holderName,
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            campaignId: campaign.id,
          },
        });

        if (!bankDetail)
          throw new InternalServerErrorException('couldnot add bank details.');

        const createdCampaign = await prisma.campaign.findFirst({
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
        return createdCampaign;
      });

      return createApiResponse({
        status: 'success',
        message:
          'campaign creaed successfully. please wait untill the review process is done',
        data: result,
      });
    } catch (err) {
      console.log(err);
    }
  }
  async getCampaigns(
    page: number,
    limit: number,
    filters: {
      category?: Category;
      fullName?: string;
      status?: CampaignStatus;
    },
    userId?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const take = limit;

      if (!filters.status) filters.status = CampaignStatus.ACTIVE;

      const campaigns = await this.prisma.campaign.findMany({
        where: {
          category: filters.category,
          status: filters.status,
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
          businessId: true,
          charityId: true,
          goalAmount: true,
          raisedAmount: true,
          category: true,
          deadline: true,
          status: true,
          like: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
          },

          charity: {
            select: {
              isOrganization: true,
            },
          },

          campaignMedia: {
            where: {
              imageType: ImageType.COVER_IMAGE,
            },
            select: {
              id: true,
              url: true,
            },
          },
          _count: {
            select: {
              Donation: {
                where: {
                  paymentStatus: PaymentStatus.VERIFIED,
                },
              },
              like: true,
            },
          },
        },
      });

      if (!campaigns)
        throw new InternalServerErrorException('Unable to get Campaigns. ');

      const campaignsWithLikeStatus = campaigns.map((campaign) => ({
        ...campaign,
        isLikedByUser: campaign.like.length > 0,
        like: undefined, // Remove the like array from response
      }));
      // TODO: may need fixing here
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
        data: campaignsWithLikeStatus,
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
  async getCampaignsAgent(
    page: number,
    limit: number,
    filters: {
      category?: Category;
      searchTerm?: string;
      status?: CampaignStatus;
    },
  ) {
    try {
      const skip = (page - 1) * limit;
      const take = limit;

      if (!filters.status) filters.status = CampaignStatus.ACTIVE;

      const campaigns = await this.prisma.campaign.findMany({
        where: {
          category: filters.category,
          status: filters.status,
          OR: [
            {
              title: {
                contains: filters.searchTerm,
              },
            },
            {
              business: {
                OR: [
                  {
                    fullName: {
                      contains: filters.searchTerm,
                    },
                  },
                  {
                    contactEmail: {
                      contains: filters.searchTerm,
                    },
                  },
                  {
                    contactPhone: {
                      contains: filters.searchTerm,
                    },
                  },
                ],
              },
            },
            {
              charity: {
                OR: [
                  {
                    fullName: {
                      contains: filters.searchTerm,
                    },
                  },
                  {
                    contactEmail: {
                      contains: filters.searchTerm,
                    },
                  },
                  {
                    contactPhone: {
                      contains: filters.searchTerm,
                    },
                  },
                ],
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

          businessId: true,
          charityId: true,
          goalAmount: true,
          raisedAmount: true,
          category: true,
          deadline: true,
          status: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          business: {
            select: {
              contactEmail: true,
              contactPhone: true,
              fullName: true,
            },
          },
          charity: {
            select: {
              contactEmail: true,
              contactPhone: true,
              fullName: true,
              isOrganization: true,
            },
          },

          campaignMedia: {
            where: {
              imageType: ImageType.COVER_IMAGE,
            },
            select: {
              id: true,
              url: true,
            },
          },
          _count: {
            select: {
              Donation: {
                where: {
                  paymentStatus: PaymentStatus.VERIFIED,
                },
              },
            },
          },
        },
      });

      if (!campaigns)
        throw new InternalServerErrorException('Unable to get Campaigns. ');
      const totalItems = campaigns.length;

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

  async getCampaignsAdmin(
    page: number,
    limit: number,
    // filters: {
    //   category?: Category;
    //   fullName?: string;
    //   status?: CampaignStatus;
    // },
  ) {
    try {
      const skip = (page - 1) * limit;
      const take = limit;

      // if (!filters.status) filters.status = CampaignStatus.ACTIVE;

      const campaigns = await this.prisma.campaign.findMany({
        where: {
          // category: filters.category,
          status: CampaignStatus.PENDING,
          // OR: [
          //   {
          //     business: {
          //       fullName: {
          //         contains: filters.fullName,
          //         // search: filters.fullName,
          //       },
          //     },
          //   },
          //   {
          //     charity: {
          //       fullName: {
          //         contains: filters.fullName,
          //       },
          //     },
          //   },
          // ],
        },
        skip,
        take,

        select: {
          id: true,
          title: true,
          description: true,
          businessId: true,
          charityId: true,
          goalAmount: true,
          raisedAmount: true,
          category: true,
          status: true,
          charity: {
            select: {
              fullName: true,
              tinNumber: true,
              licenseNumber: true,
              docs: true,
              isOrganization: true,
            },
          },
          business: {
            select: {
              fullName: true,
              tinNumber: true,
              licenseNumber: true,
              docs: true,
            },
          },

          campaignMedia: true,
          _count: {
            select: {
              Donation: {
                where: {
                  paymentStatus: PaymentStatus.VERIFIED,
                },
              },
            },
          },
        },
      });

      if (!campaigns)
        throw new InternalServerErrorException('Unable to get Campaigns. ');

      return createApiResponse({
        status: 'success',
        message: 'Fetched campaigns successfully',
        data: campaigns,
        metadata: {
          // totalItems,
          // totalPages: Math.ceil(totalItems / limit),
          pageSize: limit,
          currentPage: page,
        },
      });
    } catch (err) {
      console.log(err);
    }
  }

  async getMyCampaigns(id: string) {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: { userId: id },
        select: {
          id: true,
          title: true,
          description: true,
          businessId: true,
          charityId: true,
          goalAmount: true,
          raisedAmount: true,
          category: true,
          deadline: true,
          status: true,
          charity: {
            select: {
              isOrganization: true,
            },
          },

          campaignMedia: {
            where: {
              imageType: ImageType.COVER_IMAGE,
            },
            select: {
              id: true,
              url: true,
            },
          },
          _count: {
            select: {
              Donation: true,
            },
          },
        },
      });

      if (!campaigns)
        throw new InternalServerErrorException('unable to get campaigns.');

      return createApiResponse({
        status: 'success',
        message: 'Fetched campaigns successfully.',
        data: campaigns,
      });
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        'An unexpected error occurred. Please try again later.',
      );
    }
  }
  async getCampaign(id: string) {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          goalAmount: true,
          raisedAmount: true,
          category: true,
          deadline: true,
          status: true,
          createdAt: true,
          business: {
            select: {
              id: true,
              fullName: true,
              website: true,
              sector: true,
              publicEmail: true,
              publicPhoneNumber: true,
              country: true,
              region: true,
              city: true,
              relativeLocation: true,
              createdAt: true,
            },
          },
          charity: {
            select: {
              id: true,
              fullName: true,
              isOrganization: true,
              website: true,
              publicEmail: true,
              publicPhoneNumber: true,
              country: true,
              region: true,
              city: true,
              relativeLocation: true,
              createdAt: true,
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
          campaignMedia: true,
          CampaignUpdate: {
            select: {
              id: true,
              content: true,
              title: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              },
              agent: {
                select: {
                  id: true,
                },
              },
            },
          },
          Donation: {
            where: {
              paymentStatus: PaymentStatus.VERIFIED,
            },
            select: {
              id: true,
              amount: true,
              paymentStatus: true,
              createdAt: true,
              donorFirstName: true,
              donorLastName: true,
              isAnonymous: true,
            },
          },
        },
      });

      if (!campaign)
        throw new InternalServerErrorException('unable to get campaign.');

      return createApiResponse({
        status: 'success',
        message: 'Fetched campaign successfully.',
        data: campaign,
      });
    } catch (err) {
      console.log(err);
    }
  }

  async changeCampaignStatus(id: string, status: CampaignStatus) {
    try {
      const campaign = await this.prisma.campaign.findFirst({ where: { id } });
      if (!campaign) throw new NotFoundException('couldnt find campaign');

      const updatedCampaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          status,
        },
        include: {
          business: {
            select: {
              id: true,
              fullName: true,
              website: true,
              sector: true,
              publicEmail: true,
              publicPhoneNumber: true,
              country: true,
              region: true,
              city: true,
              relativeLocation: true,
              createdAt: true,
            },
          },
          charity: {
            select: {
              id: true,
              fullName: true,
              isOrganization: true,
              website: true,
              publicEmail: true,
              publicPhoneNumber: true,
              country: true,
              region: true,
              city: true,
              relativeLocation: true,
              createdAt: true,
            },
          },
          campaignMedia: true,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'Updated Campaign status.',
        data: updatedCampaign,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        'something went wrong. couldnt change campaign status.',
      );
    }
  }

  async deleteCampaign(campaignId: string, userId: string) {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: campaignId, userId },
      });

      if (!campaign) throw new NotFoundException('couldnt find campaign');
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.DELETED,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'deleted campaign successfully.',
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('couldnt delete campaign.');
    }
  }

  async sendCloseVerificationCode(id: string) {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id },
        include: {
          charity: true,
          business: true,
        },
      });

      if (!campaign) throw new NotFoundException('couldnt find campaign');

      const campaignType = campaign.businessId
        ? 'business'
        : campaign.charity.isOrganization
          ? 'organization'
          : 'personal';

      let contactInfo: string;

      if (campaignType === 'business') {
        contactInfo = campaign.business.contactPhone;
      } else {
        contactInfo = campaign.charity.contactPhone;
      }

      const verificationCode = this.authService.generateVerificationCode();

      await this.prisma.campaign.update({
        where: { id },
        data: {
          closeCampaignVerificationCode: verificationCode,
          closeCampaignVerificationCodeExpiresAt: new Date(
            Date.now() + 15 * 60 * 1000,
          ),
        },
      });

      try {
        await this.smsService.sendSMS(
          contactInfo,
          `This is Your Verification code. ${verificationCode} Use this to confirm that you want to close your campaign.  `,
        );
      } catch (err) {
        console.log(err);
        throw new InternalServerErrorException('Failed to send sms');
      }
      return createApiResponse({
        status: 'success',
        message: 'verification code sms has been sent.',
        data: {},
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('couldnt send verification code.');
    }
  }

  async verifyCampaignCode(id: string, code: string) {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id },
      });

      if (!campaign) throw new NotFoundException('couldnt find campaign');

      if (
        !campaign.closeCampaignVerificationCode ||
        !campaign.closeCampaignVerificationCodeExpiresAt
      )
        throw new BadRequestException(
          'verification code has not been sent yet.',
        );

      if (campaign.closeCampaignVerificationCode !== Number(code))
        throw new BadRequestException('invalid verification code.');

      if (
        campaign.closeCampaignVerificationCodeExpiresAt < new Date(Date.now())
      )
        throw new BadRequestException('verification code has expired.');

      await this.prisma.campaign.update({
        where: { id },
        data: {
          closeCampaignVerificationCode: null,
          closeCampaignVerificationCodeExpiresAt: null,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'campaign closed successfully.',
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('couldnt verify campaign code.');
    }
  }

  async closeCampaign(campaignId: string, dto: CloseCampaignDto) {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: campaignId },
      });

      if (!campaign) throw new NotFoundException('couldnt find campaign');

      if (campaign.status !== CampaignStatus.ACTIVE)
        throw new BadRequestException('campaign is not active.');

      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.CANCELED,
        },
      });

      const closedCampaign = await this.prisma.closedCampaign.create({
        data: {
          reason: dto.reason,
          campaignId: campaign.id,
          isCompleted: false,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'campaign closed successfully.',
        data: closedCampaign,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('couldnt close campaign.');
    }
  }

  async addCampaignUpdate(
    campaignId: string,
    dto: AddCampaignUpdateDto,
    actor: userReq,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        status: CampaignStatus.ACTIVE,
      },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found or is not active.');
    }

    const actorType =
      actor.role === 'USER'
        ? { userId: actor.userId }
        : { agentId: actor.userId };

    const update = await this.prisma.campaignUpdate.create({
      data: {
        content: dto.content,
        campaignId: campaign.id,
        title: dto.title,
        ...actorType,
      },
    });

    if (!update) {
      throw new InternalServerErrorException('Failed to add campaign update.');
    }

    return createApiResponse({
      status: 'success',
      message: 'Campaign update added successfully.',
      data: update,
    });
  }
}
