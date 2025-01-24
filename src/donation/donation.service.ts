import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ChapaService } from 'chapa-nestjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDonationDto } from './dto';
import { CampaignStatus, PaymentStatus } from '@prisma/client';
import { createApiResponse } from 'src/utils';
import { ConfigService } from '@nestjs/config';
import { Medium } from 'src/common/enums';

@Injectable()
export class DonationService {
  constructor(
    private readonly prisma: PrismaService,
    private chapa: ChapaService,
    private config: ConfigService,
  ) {}
  async donate(
    dto: CreateDonationDto,
    campaignId: string,
    medium: Medium,
    userId?: string,
  ) {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: campaignId, status: CampaignStatus.ACTIVE },
      });

      if (!campaign) throw new NotFoundException('Couldnt find campaign');

      const txRef = await this.chapa.generateTransactionReference({ size: 20 });

      const donation = await this.prisma.donation.create({
        data: {
          campaignId,
          userId,
          amount: dto.amount,
          txRef,
          donorFirstName: dto.donorFirstName,
          donorLastName: dto.donorLastName,
          email: dto.email,
          isAnonymous: dto.isAnonymus,
        },
      });
      if (!donation)
        throw new InternalServerErrorException('Couldnt create donation');

      let response: any;
      if (medium == Medium.MOBILE) {
        response = await this.chapa.mobileInitialize({
          first_name: dto.donorFirstName,
          last_name: dto.donorLastName,
          email: dto.email,
          currency: 'ETB',
          amount: dto.amount,
          tx_ref: txRef,
          callback_url:
            'https://webhook.site/1aa8bca0-b2a2-455a-8a12-10c9fc5f78b7',
          return_url: 'https://github.com/Chapa-Et/chapa-nestjs',
          customization: {
            title: 'donation',
            description: 'Test Description',
          },
        });
      } else {
        response = await this.chapa.initialize({
          first_name: dto.donorFirstName,
          last_name: dto.donorLastName,
          email: dto.email,
          currency: 'ETB',
          amount: dto.amount,
          tx_ref: txRef,
          callback_url:
            'https://webhook.site/1aa8bca0-b2a2-455a-8a12-10c9fc5f78b7',
          return_url: 'https://github.com/Chapa-Et/chapa-nestjs',
          customization: {
            title: 'donation',
            description: 'Test Description',
          },
        });
      }

      if (!response)
        throw new HttpException(
          'couldnot process payment.',
          HttpStatus.BAD_GATEWAY,
        );

      return createApiResponse({
        status: 'success',
        message: 'you will be redirected to a checkout screen',
        data: { checkoutUrl: response.data.checkout_url, txRef },
      });
    } catch (err) {
      console.log(err);
    }
  }

  async verify(txRef: string) {
    const response = await this.chapa.verify({ tx_ref: txRef });

    if (response.status == 'success' && response.data.status == 'success') {
      const donation = await this.prisma.donation.findUnique({
        where: { txRef: response.data.tx_ref },
      });

      if (!donation || donation.paymentStatus !== 'PENDING') return 'no change';

      const verifiedDonation = await this.prisma.donation.update({
        where: { txRef: response.data.tx_ref },
        data: { paymentStatus: PaymentStatus.VERIFIED },
      });

      const campaign = await this.prisma.campaign.update({
        where: { id: verifiedDonation.campaignId },
        data: {
          raisedAmount: {
            increment: verifiedDonation.amount,
          },
        },
      });

      return campaign;
    }
  }
}
