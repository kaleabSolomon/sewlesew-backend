import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';
import {
  CreateBusinessCampaignDto,
  CreateOrganizationalCharityCampaignDto,
  CreatePersonalCharityCampaignDto,
} from './dto';

import * as moment from 'moment';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { DocType, ImageType } from '@prisma/client';
import { Doc, Image } from 'src/common/types';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

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
    @GetCurrentUser('userId') id: string,
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
      { docType: DocType.TIN_CERTIFICATE, url: tinCert.url },
      { docType: DocType.REGISTRATION_CERTIFICATE, url: regLicence.url },
    ];

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
    @GetCurrentUser('userId') id: string,
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
      { docType: DocType.TIN_CERTIFICATE, url: tinCert.url },
      { docType: DocType.REGISTRATION_CERTIFICATE, url: regLicence.url },
    ];

    return await this.campaignService.createOrganizationalCharityCampaign(
      id,
      dto,
      images,
      docs,
    );
  }

  async createPersonalCampaign(dto: CreatePersonalCharityCampaignDto) {}
  // get campaigns
  // get my campaigns
  // get campaign
  // get campaign images
  // get images legaldocs
  // changeCampaignStatus
  // delete campaign
  // close campaign
}
