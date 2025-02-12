import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DonationService } from './donation.service';
import { GetCurrentUser, NoAuth } from 'src/common/decorators';
import { CreateDonationDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { Medium } from 'src/common/enums';

@Controller('donation')
export class DonationController {
  constructor(
    private donationService: DonationService,
    private config: ConfigService,
  ) {}

  @Post('verify')
  @NoAuth()
  async verify(
    @Req() req: Express.Request,
    @Res() res: Express.Response,
    @Headers('x-chapa-signature') chapaSignature: string,
  ) {
    try {
      // console.log('hello');
      // // Validate the webhook signature
      const hash = crypto
        .createHmac('sha256', this.config.get<string>('CHAPA_WEBHOOK_SECRET'))
        .update(JSON.stringify(req['body']))
        .digest('hex');

      if (hash !== chapaSignature) {
        throw new BadRequestException('Invalid Chapa signature');
      }

      // console.log(res);

      const { tx_ref } = req['body'];

      return await this.donationService.verify(tx_ref);
    } catch (err) {
      console.error(err.message);
    }
  }

  // @Post('verify/:txRef')
  // @NoAuth()
  // async verify(@Param('txRef') txRef: string) {
  //   return await this.donationService.verify(txRef);
  // }

  @Post(':id')
  async donate(
    @Body() dto: CreateDonationDto,
    @Param('id') campaignId: string,
    @GetCurrentUser('userId') userId: string,
    @Query('medium') medium?: Medium,
  ) {
    if (!medium) medium = Medium.Web;
    return await this.donationService.donate(dto, campaignId, medium, userId);
  }

  @Post('guest/:id')
  @NoAuth()
  async donateGuest(
    @Body() dto: CreateDonationDto,
    @Param('id') campaignId: string,
    @Query('medium') medium?: Medium,
  ) {
    if (!medium) medium = Medium.Web;

    return await this.donationService.donate(dto, campaignId, medium);
  }
  @Get('me')
  async getDonationsByUser(@GetCurrentUser('userId') userId: string) {
    return await this.donationService.getDonationsByUser(userId);
  }
  @Get(':campaignId')
  @NoAuth()
  async getDonationsByCampaign(@Param('campaignId') campaignId: string) {
    return await this.donationService.getDonationsByCampaign(campaignId);
  }
}
