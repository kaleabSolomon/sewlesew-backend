import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { GetCurrentUser, NoAuth, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';
import {
  CreateBusinessCampaignDto,
  CreateOrganizationalCharityCampaignDto,
  CreatePersonalCharityCampaignDto,
} from './dto';

import moment from 'moment';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CampaignStatus, Category, DocType, ImageType } from '@prisma/client';
import { Doc, Image, userReq } from 'src/common/types';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { CloseCampaignDto } from './dto/closeCampaign.dto';
import { OptionalAuth } from 'src/common/decorators/optionalAuth.decorator';
import { AddCampaignUpdateDto } from './dto/addCampaignUpdate.dto';

@Controller('campaign')
export class CampaignController {
  constructor(
    private campaignService: CampaignService,
    private cloudinary: CloudinaryService,
  ) {}

  // create campaign
  @Post('business')
  @Roles(Role.USER, Role.CALLCENTERAGENT)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'tinCertificate', maxCount: 1 },
      {
        name: 'registrationLicense',
        maxCount: 1,
      },
      {
        name: 'logo',
        maxCount: 1,
      },
      {
        name: 'supportingDocuments',
        maxCount: 2,
      },
      {
        name: 'coverImage',
        maxCount: 1,
      },
      {
        name: 'otherImages',
        maxCount: 4,
      },
    ]),
  )
  async createBusinessCampaign(
    @GetCurrentUser() user: userReq,
    @UploadedFiles()
    files: {
      tinCertificate?: Express.Multer.File[];
      registrationLicense?: Express.Multer.File[];
      logo?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
      otherImages?: Express.Multer.File[];
    },
    @Body() dto: CreateBusinessCampaignDto,
  ) {
    const { deadline } = dto;
    let docs: Doc[] = [];
    let images: Image[] = [];
    let logo: UploadApiResponse | UploadApiErrorResponse | undefined;

    console.log(files.otherImages);

    const campaignExists = await this.campaignService.checkCampaignExists(
      dto.tinNumber,
      dto.licenseNumber,
    );
    if (campaignExists)
      throw new ConflictException(
        'This Business or Charity is Already Registered. ',
      );

    if (!files.tinCertificate || files.tinCertificate.length === 0) {
      throw new BadRequestException(
        'tin certificate is required to proceed with registration',
      );
    }
    if (!files.registrationLicense || files.registrationLicense.length === 0) {
      throw new BadRequestException(
        'registration license is required to proceed with registration',
      );
    }

    if (!files.coverImage || files.coverImage.length === 0) {
      throw new BadRequestException(
        'cover image is required to proceed with registration',
      );
    }

    if (!deadline) {
      throw new BadRequestException('Deadline is required.');
    }

    // Check if deadline is at least 3 days in the future

    const deadlineDate = moment(deadline);
    const now = moment();
    const minDate = now.add(3, 'days');

    if (!deadlineDate.isValid()) {
      throw new BadRequestException('Deadline must be a valid date.');
    }

    if (deadlineDate.isBefore(minDate)) {
      throw new BadRequestException(
        'Deadline must be at least 3 days in the future.',
      );
    }

    const tinCert = await this.cloudinary.uploadFile(files.tinCertificate[0]);
    if (!tinCert || !tinCert.url)
      throw new InternalServerErrorException(
        'Failed to upload Your Tin Certificate',
      );

    const regLicence = await this.cloudinary.uploadFile(
      files.registrationLicense[0],
    );

    if (!regLicence || !regLicence.url)
      throw new InternalServerErrorException(
        'Failed to upload Registration License',
      );

    const coverImage = await this.cloudinary.uploadFile(files.coverImage[0]);

    if (!coverImage || !coverImage.url)
      throw new InternalServerErrorException(
        'Failed to upload Registration License',
      );

    if (files.logo && files.logo[0]) {
      logo = await this.cloudinary.uploadFile(files.logo[0]);
      if (!logo || !logo.url) {
        throw new InternalServerErrorException(
          'Failed to upload Your Business Logo',
        );
      }

      images.push({ imgType: ImageType.LOGO, url: logo.url });
    }

    if (files.supportingDocuments && files.supportingDocuments.length > 0) {
      for (const doc of files.supportingDocuments) {
        const uploadedDoc = await this.cloudinary.uploadFile(doc);
        if (!uploadedDoc || !uploadedDoc.url) {
          throw new InternalServerErrorException(
            'Failed to upload Supporting Document',
          );
        }
        docs.push({
          docType: DocType.SUPPORTING_DOCUMENT,
          url: uploadedDoc.url,
        });
      }
    }

    console.log('about to upload other images');

    if (files.otherImages && files.otherImages.length > 0) {
      for (const img of files.otherImages) {
        const uploadedImg = await this.cloudinary.uploadFile(img);
        if (!uploadedImg || !uploadedImg.url) {
          throw new InternalServerErrorException('Failed to upload image');
        }
        images.push({
          imgType: ImageType.SUPPORTING_IMAGE,
          url: uploadedImg.url,
        });
      }
    }

    console.log('other images uploaded');

    images = [
      ...images,
      { imgType: ImageType.COVER_IMAGE, url: coverImage.url },
    ];
    docs = [
      ...docs,
      { docType: DocType.TIN_CERTIFICATE, url: tinCert.url },
      { docType: DocType.REGISTRATION_CERTIFICATE, url: regLicence.url },
    ];

    console.log('images uploaded and done: ', images);

    const id = user.userId;
    const role = user.role;

    if (role === Role.CALLCENTERAGENT) {
      return await this.campaignService.createBusinessCampaignAgent(
        id,
        dto,
        images,
        docs,
      );
    }
    return await this.campaignService.createBusinessCampaign(
      id,
      dto,
      images,
      docs,
    );
  }
  @Post('charity/organization')
  @Roles(Role.USER, Role.CALLCENTERAGENT)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'tinCertificate', maxCount: 1 },
      {
        name: 'registrationLicense',
        maxCount: 1,
      },
      {
        name: 'logo',
        maxCount: 1,
      },
      {
        name: 'supportingDocuments',
        maxCount: 2,
      },
      {
        name: 'coverImage',
        maxCount: 1,
      },
      {
        name: 'otherImages',
        maxCount: 4,
      },
    ]),
  )
  async createCharityCampaign(
    @GetCurrentUser() user: userReq,
    @UploadedFiles()
    files: {
      tinCertificate?: Express.Multer.File[];
      registrationLicense?: Express.Multer.File[];
      logo?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
      otherImages?: Express.Multer.File[];
    },
    @Body() dto: CreateOrganizationalCharityCampaignDto,
  ) {
    let docs: Doc[] = [];
    let images: Image[] = [];
    let logo: UploadApiResponse | UploadApiErrorResponse | undefined;

    console.log(files);

    const campaignExists = await this.campaignService.checkCampaignExists(
      dto.tinNumber,
      dto.licenseNumber,
    );
    if (campaignExists)
      throw new ConflictException(
        'This Business or Charity is Already Registered. ',
      );
    if (!files.tinCertificate || files.tinCertificate.length === 0) {
      throw new BadRequestException(
        'tin certificate is required to proceed with registration',
      );
    }
    if (!files.registrationLicense || files.registrationLicense.length === 0) {
      throw new BadRequestException(
        'registration license is required to proceed with registration',
      );
    }

    if (!files.coverImage || files.coverImage.length === 0) {
      throw new BadRequestException(
        'cover image is required to proceed with registration',
      );
    }

    // Check if deadline is at least 3 days in the future
    const deadlineDate = moment(dto.deadline);
    const now = moment();
    const minDate = now.add(3, 'days');

    if (!deadlineDate.isValid()) {
      throw new BadRequestException('Deadline must be a valid date.');
    }

    if (deadlineDate.isBefore(minDate)) {
      throw new BadRequestException(
        'Deadline must be at least 3 days in the future.',
      );
    }

    const tinCert = await this.cloudinary.uploadFile(files.tinCertificate[0]);
    if (!tinCert || !tinCert.url)
      throw new InternalServerErrorException(
        'Failed to upload Your Tin Certificate',
      );

    const regLicence = await this.cloudinary.uploadFile(
      files.registrationLicense[0],
    );

    if (!regLicence || !regLicence.url)
      throw new InternalServerErrorException(
        'Failed to upload Registration License',
      );

    const coverImage = await this.cloudinary.uploadFile(files.coverImage[0]);

    if (!coverImage || !coverImage.url)
      throw new InternalServerErrorException(
        'Failed to upload Registration License',
      );

    if (files.logo && files.logo[0]) {
      logo = await this.cloudinary.uploadFile(files.logo[0]);
      if (!logo || !logo.url) {
        throw new InternalServerErrorException(
          'Failed to upload Your Business Logo',
        );
      }

      images.push({ imgType: ImageType.LOGO, url: logo.url });
    }

    if (files.supportingDocuments && files.supportingDocuments.length > 0) {
      for (const doc of files.supportingDocuments) {
        const uploadedDoc = await this.cloudinary.uploadFile(doc);
        if (!uploadedDoc || !uploadedDoc.url) {
          throw new InternalServerErrorException(
            'Failed to upload Supporting Document',
          );
        }
        docs.push({
          docType: DocType.SUPPORTING_DOCUMENT,
          url: uploadedDoc.url,
        });
      }
    }

    console.log('about to upload other images');

    if (files.otherImages && files.otherImages.length > 0) {
      for (const img of files.otherImages) {
        const uploadedImg = await this.cloudinary.uploadFile(img);
        if (!uploadedImg || !uploadedImg.url) {
          throw new InternalServerErrorException('Failed to upload image');
        }
        images.push({
          imgType: ImageType.SUPPORTING_IMAGE,
          url: uploadedImg.url,
        });
      }
    }

    console.log('other images uploaded');

    console.log('images uploaded and done: ', images);

    images = [
      ...images,
      { imgType: ImageType.COVER_IMAGE, url: coverImage.url },
    ];
    docs = [
      ...docs,
      { docType: DocType.TIN_CERTIFICATE, url: tinCert.url },
      { docType: DocType.REGISTRATION_CERTIFICATE, url: regLicence.url },
    ];
    const id = user.userId;
    const role = user.role;
    if (role === Role.CALLCENTERAGENT) {
      return await this.campaignService.createOrganizationalCharityCampaignAgent(
        id,
        dto,
        images,
        docs,
      );
    }
    return await this.campaignService.createOrganizationalCharityCampaign(
      id,
      dto,
      images,
      docs,
    );
  }
  @Post('charity/personal')
  @Roles(Role.USER, Role.CALLCENTERAGENT)
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'personalDocument',
        maxCount: 1,
      },
      {
        name: 'supportingDocuments',
        maxCount: 2,
      },
      {
        name: 'coverImage',
        maxCount: 1,
      },
      {
        name: 'otherImages',
        maxCount: 4,
      },
    ]),
  )
  async createPersonalCampaign(
    @GetCurrentUser() user: userReq,
    @UploadedFiles()
    files: {
      personalDocument?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
      otherImages?: Express.Multer.File[];
    },
    @Body() dto: CreatePersonalCharityCampaignDto,
  ) {
    let docs: Doc[] = [];
    let images: Image[] = [];

    const campaignExists =
      await this.campaignService.checkPersonalCampaignExists(user.userId);
    if (campaignExists)
      throw new ConflictException(
        'You already have an ongoing campaign. Only One active campaign is allowed per user. ',
      );
    if (!files.personalDocument || files.personalDocument.length === 0) {
      throw new BadRequestException(
        'Personal document is required to proceed with registration',
      );
    }

    if (!files.coverImage || files.coverImage.length === 0) {
      throw new BadRequestException(
        'cover image is required to proceed with registration',
      );
    }

    // Check if deadline is at least 3 days in the future
    const deadlineDate = moment(dto.deadline);
    const now = moment();
    const minDate = now.add(3, 'days');

    if (!deadlineDate.isValid()) {
      throw new BadRequestException('Deadline must be a valid date.');
    }

    if (deadlineDate.isBefore(minDate)) {
      throw new BadRequestException(
        'Deadline must be at least 3 days in the future.',
      );
    }

    const personalDoc = await this.cloudinary.uploadFile(
      files.personalDocument[0],
    );
    if (!personalDoc || !personalDoc.url)
      throw new InternalServerErrorException(
        'Failed to upload Your Tin Certificate',
      );

    const coverImage = await this.cloudinary.uploadFile(files.coverImage[0]);

    if (!coverImage || !coverImage.url)
      throw new InternalServerErrorException(
        'Failed to upload Registration License',
      );

    if (files.supportingDocuments && files.supportingDocuments.length > 0) {
      for (const doc of files.supportingDocuments) {
        const uploadedDoc = await this.cloudinary.uploadFile(doc);
        if (!uploadedDoc || !uploadedDoc.url) {
          throw new InternalServerErrorException(
            'Failed to upload Supporting Document',
          );
        }
        docs.push({
          docType: DocType.SUPPORTING_DOCUMENT,
          url: uploadedDoc.url,
        });
      }
    }

    if (files.otherImages && files.otherImages.length > 0) {
      for (const img of files.otherImages) {
        const uploadedImg = await this.cloudinary.uploadFile(img);
        if (!uploadedImg || !uploadedImg.url) {
          throw new InternalServerErrorException('Failed to upload image');
        }
        images.push({
          imgType: ImageType.SUPPORTING_IMAGE,
          url: uploadedImg.url,
        });
      }
    }

    images = [
      ...images,
      { imgType: ImageType.COVER_IMAGE, url: coverImage.url },
    ];
    docs = [
      ...docs,
      { docType: DocType.PERSONAL_DOCUMENT, url: personalDoc.url },
    ];
    const id = user.userId;
    const role = user.role;
    if (role === Role.CALLCENTERAGENT) {
      return await this.campaignService.createPersonalCharityCampaignAgent(
        id,
        dto,
        images,
        docs,
      );
    }
    return await this.campaignService.createPersonalCharityCampaign(
      id,
      dto,
      images,
      docs,
    );
  }

  @Get('')
  @OptionalAuth()
  async getCampaigns(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('for') fullName?: string,
    @GetCurrentUser('userId') userId?: string,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);

    const filters: {
      category?: Category;
      fullName?: string;
    } = {};

    if (category && !Object.values(Category).includes(category as Category)) {
      throw new BadRequestException(`Invalid category: ${category}`);
    }

    filters.category = category as Category;
    if (fullName) filters.fullName = fullName;
    return await this.campaignService.getCampaigns(
      page,
      limit,
      filters,
      userId,
    );
  }

  @Get('agent')
  @NoAuth()
  async getCampaignsAgent(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('search') searchTerm?: string,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);

    const filters: {
      category?: Category;
      searchTerm?: string;
    } = {};

    if (category && !Object.values(Category).includes(category as Category)) {
      throw new BadRequestException(`Invalid category: ${category}`);
    }

    filters.category = category as Category;
    if (searchTerm) filters.searchTerm = searchTerm;
    return await this.campaignService.getCampaignsAgent(page, limit, filters);
  }

  @Get('/admin')
  // @Roles(Role.SUPERADMIN)
  @NoAuth()
  async getCampaingsAdmin(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    // @GetCurrentUser('role') role: Role,
    // @Query('category') category?: string,
    // @Query('for') fullName?: string,
    // @Query('status') status?: string,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);

    // const filters: {
    //   category?: Category;
    //   fullName?: string;
    //   status?: CampaignStatus;
    // } = {};

    // if (
    //   status &&
    //   role &&
    //   role === Role.SUPERADMIN &&
    //   Object.values(CampaignStatus).includes(status as CampaignStatus)
    // ) {
    //   filters.status = status as CampaignStatus;
    // } else {
    //   filters.status = CampaignStatus.ACTIVE;
    // }

    // if (category && !Object.values(Category).includes(category as Category)) {
    //   throw new BadRequestException(`Invalid category: ${category}`);
    // }

    // filters.category = category as Category;
    // if (fullName) filters.fullName = fullName;
    return await this.campaignService.getCampaignsAdmin(page, limit);
  }

  @Patch('verify/:id')
  @Roles(Role.USER, Role.CALLCENTERAGENT)
  async verifyCampaign(
    @Param('id') id: string,
    @GetCurrentUser() user: userReq,
  ) {
    console.log('user: ', user);

    return await this.campaignService.sendCloseVerificationCode(id);
  }

  @Get('me')
  @Roles(Role.USER)
  async getMyCampaigns(@GetCurrentUser('userId') id: string) {
    return await this.campaignService.getMyCampaigns(id);
  }

  // get campaign
  @Get(':id')
  @NoAuth()
  async getCampaign(@Param('id') id: string) {
    return await this.campaignService.getCampaign(id);
  }
  // get campaing docs and images

  // changeCampaignStatus
  @Patch(':id/status')
  @NoAuth()
  // @Roles(Role.CAMPAIGNREVIEWER)
  async changeCampaignStatus(
    @Param('id') campaignId: string,
    @Body('status') status: string,
  ) {
    if (!Object.values(CampaignStatus).includes(status as CampaignStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    return await this.campaignService.changeCampaignStatus(
      campaignId,
      status as CampaignStatus,
    );
  }

  // delete campaign

  @Delete(':id')
  @Roles(Role.USER, Role.CALLCENTERAGENT)
  async deleteCampaign(
    @Param('id') campaignId: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return await this.campaignService.deleteCampaign(campaignId, userId);
  }

  @Post(':id/verify-code')
  async verifyCampaignCode(
    @Param('id') campaignId: string,
    @Body('verificationCode') code: string,
  ) {
    return await this.campaignService.verifyCampaignCode(campaignId, code);
  }

  @Patch(':id/close')
  async closeCampaign(
    @Param('id') campaignId: string,
    @Body() dto: CloseCampaignDto,
  ) {
    return await this.campaignService.closeCampaign(campaignId, dto);
  }

  @Post(':id/update')
  @Roles(Role.USER, Role.CALLCENTERAGENT)
  async addCampaignUpdate(
    @Param('id') campaignId: string,
    @Body()
    dto: AddCampaignUpdateDto,
    @GetCurrentUser() actor: userReq,
  ) {
    return await this.campaignService.addCampaignUpdate(campaignId, dto, actor);
  }
}
