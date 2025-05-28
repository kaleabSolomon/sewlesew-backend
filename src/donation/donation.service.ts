import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ChapaService } from 'chapa-nestjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDonationDto, CreateStripeDonationDto } from './dto';
import { CampaignStatus, PaymentStatus } from '@prisma/client';
import { createApiResponse } from 'src/utils';
import { ConfigService } from '@nestjs/config';
import { Medium } from 'src/common/enums';
import { CurrencyService } from 'src/currency/currency.service';

@Injectable()
export class DonationService {
  constructor(
    private readonly prisma: PrismaService,
    private chapa: ChapaService,
    private config: ConfigService,
    private currencyService: CurrencyService,
  ) {}
  async donateChapa(
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
          currency: 'ETB',
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

      const campaign = await this.finalizeDonation(
        donation.txRef,
        PaymentStatus.VERIFIED,
        'ETB',
      );

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

  async createDonation(dto: CreateStripeDonationDto, txRef: string) {
    const { campaignId, userId, ...donationData } = dto;

    // Verify campaign exists
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Verify user exists if userId provided
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    try {
      const donation = await this.prisma.donation.create({
        data: {
          ...donationData,
          txRef,
          campaignId,
          userId,
          currency: 'USD',
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'Donation initiated successfully',
        data: donation,
      });
    } catch (error) {
      console.error('Error creating donation:', error);
      throw new InternalServerErrorException('Failed to create donation');
    }
  }

  async updateDonationStatus(txRef: string, status: PaymentStatus) {
    try {
      const donation = await this.prisma.donation.update({
        where: { txRef },
        data: { paymentStatus: status },
      });

      return donation;
    } catch (error) {
      console.error('Error updating donation status:', error);
      throw new InternalServerErrorException(
        'Failed to update donation status',
      );
    }
  }

  async finalizeDonation(
    txRef: string,
    status: PaymentStatus,
    currency: 'ETB' | 'USD',
  ) {
    try {
      const donation = await this.prisma.donation.update({
        where: { txRef },
        data: { paymentStatus: status },
      });

      let raisedAmount = {};

      if (currency === 'ETB') {
        raisedAmount = {
          raisedAmount: {
            increment: donation.amount,
          },
        };
      } else if (currency === 'USD') {
        raisedAmount = {
          raisedAmountUSD: {
            increment: donation.amount,
          },
        };
      } else {
        throw new InternalServerErrorException('Invalid currency type');
      }

      const campaign = await this.prisma.campaign.update({
        where: { id: donation.campaignId },
        data: raisedAmount,
      });

      const campaignCurrency = campaign.goalCurrency;
      let condition: boolean;

      if (campaignCurrency === currency) {
        if (currency === 'USD') {
          const etbRaisedToUsd = await this.currencyService.convertEtbToUsd(
            Number(campaign.raisedAmount),
          );

          const totalRaisedInUsd =
            etbRaisedToUsd + Number(campaign.raisedAmountUSD);

          console.log(
            `Total raised in USD: ${totalRaisedInUsd}, Goal in USD: ${campaign.goalAmount}`,
          );

          condition = totalRaisedInUsd >= Number(campaign.goalAmount);
        } else {
          const usdRaisedToEtb = await this.currencyService.convertUsdToEtb(
            Number(campaign.raisedAmountUSD),
          );

          const totalRaisedInEtb =
            usdRaisedToEtb + Number(campaign.raisedAmount);

          console.log(
            `Total raised in USD: ${totalRaisedInEtb}, Goal in USD: ${campaign.goalAmount}`,
          );

          condition = totalRaisedInEtb >= Number(campaign.goalAmount);
        }
      } else {
        if (currency === 'ETB') {
          const usdRaisedToEtb = await this.currencyService.convertUsdToEtb(
            Number(campaign.raisedAmountUSD),
          );

          const totalRaisedInEtb =
            usdRaisedToEtb + Number(campaign.raisedAmount);

          console.log(
            `Total raised in ETB: ${totalRaisedInEtb}, Goal in ETB: ${campaign.goalAmount}`,
          );

          condition = totalRaisedInEtb >= Number(campaign.goalAmount);
        } else {
          const etbRaisedToUsd = await this.currencyService.convertEtbToUsd(
            Number(campaign.raisedAmount),
          );

          const totalRaisedInUsd =
            etbRaisedToUsd + Number(campaign.raisedAmountUSD);

          console.log(
            `Total raised in USD: ${totalRaisedInUsd}, Goal in USD: ${campaign.goalAmount}`,
          );

          condition = totalRaisedInUsd >= Number(campaign.goalAmount);
        }
      }

      if (condition) {
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
    } catch (error) {
      console.error('Error updating donation status:', error);
      throw new InternalServerErrorException(
        'Failed to update donation status',
      );
    }
  }

  async getDonationByTxRef(txRef: string) {
    return this.prisma.donation.findUnique({
      where: { txRef },
      include: {
        campaign: true,
        user: true,
      },
    });
  }
}
