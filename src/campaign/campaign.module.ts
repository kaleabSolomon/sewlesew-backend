import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthService } from 'src/auth/auth.service';
import { SmsService } from 'src/sms/sms.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [CampaignController],
  providers: [
    CampaignService,
    CloudinaryService,
    AuthService,
    SmsService,
    EmailService,
  ],
})
export class CampaignModule {}
