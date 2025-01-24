import { Body, Controller, Param, Post } from '@nestjs/common';
import { DonationService } from './donation.service';
import { GetCurrentUser, NoAuth } from 'src/common/decorators';
import { CreateDonationDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Controller('donation')
export class DonationController {
  constructor(
    private donationService: DonationService,
    private config: ConfigService,
  ) {}

  //   @Post('verify')
  //   @NoAuth()
  //   async verify(
  //     @Req() req: Express.Request,
  //     @Res() res: Express.Response,
  //     @Headers('x-chapa-signature') chapaSignature: string,
  //   ) {
  //     try {
  //       // Validate the webhook signature
  //       const hash = crypto
  //         .createHmac('sha256', this.config.get<string>('CHAPA_WEBHOOK_SECRET'))
  //         .update(JSON.stringify(req['body']))
  //         .digest('hex');

  //       if (hash !== chapaSignature) {
  //         throw new BadRequestException('Invalid Chapa signature');
  //       }

  //       const { tx_ref, status } = req['body'];

  //       return await this.donationService.verify(tx_ref, status);
  //     } catch (err) {
  //       console.error(err.message);
  //     }
  //   }

  @Post('verify/:txRef')
  @NoAuth()
  async verify(@Param('txRef') txRef: string) {
    return await this.donationService.verify(txRef);
  }

  @Post(':id')
  async donate(
    @Body() dto: CreateDonationDto,
    @Param('id') campaignId: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return await this.donationService.donate(dto, campaignId, userId);
  }
}
