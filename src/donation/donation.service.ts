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
          isAnonymous: dto.isAnonymous,
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
          callback_url: `${this.config.get('CALLBACK_URL')}/api/donation/verify`,
          // return_url: 'http://localhost:5173/capnsd/dshfasd',
          // return_url: `${this.config.get('RETURN_URL')}campaign/${campaignId}`,
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
          callback_url: `${this.config.get('CALLBACK_URL')}/api/donation/verify`,
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
      throw new InternalServerErrorException(err);
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

      // Step 3: Check if goal is met and close campaign
      if (campaign.raisedAmount <= campaign.goalAmount) {
        console.log('closing bcz goal is met');
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'CLOSED' },
        });

        await this.prisma.closedCampaign.create({
          data: {
            campaignId: campaign.id,
            isCompleted: true,
            reason: 'Target Goal met',
          },
        });

        console.log(`Campaign ${campaign.id} closed as it reached its goal.`);
      }

      return campaign;
    }
  }

  async getDonationsByCampaign(campaignId: string) {
    try {
      const donations = await this.prisma.donation.findMany({
        where: { campaignId, paymentStatus: PaymentStatus.VERIFIED },
      });

      if (!donations)
        throw new InternalServerErrorException('couldnot get donations');
      return createApiResponse({
        status: 'success',
        message: 'Fetched donations successfully',
        data: donations,
      });
    } catch (err) {
      console.log(err);
    }
  }

  async getDonationsByUser(userId: string) {
    try {
      const donations = await this.prisma.donation.findMany({
        where: { userId, paymentStatus: PaymentStatus.VERIFIED },
      });

      if (!donations)
        throw new InternalServerErrorException('couldnot get donations');
      return createApiResponse({
        status: 'success',
        message: 'Fetched donations successfully',
        data: donations,
      });
    } catch (err) {
      console.log(err);
    }
  }
}
