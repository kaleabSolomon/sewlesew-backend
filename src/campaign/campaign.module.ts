import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [CampaignController],
  providers: [CampaignService, CloudinaryService],
})
export class CampaignModule {}
