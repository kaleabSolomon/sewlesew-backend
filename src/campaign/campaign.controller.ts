import { Controller, Post } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';

@Controller('campaign')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  // create campaign
  @Post()
  @Roles(Role.USER, Role.CALLCENTERAGENT)
  async createBusinessCampaign(dto: CreateBusinessCampaignDto) {}

  async createCharityCampaign(dto: CreateCharityCampaignDto) {}

  async createPersonalCampaign(dto: CreatePersonalCampaignDto) {}
  // get campaigns
  // get my campaigns
  // get campaign
  // get campaign images
  // get images legaldocs
  // changeCampaignStatus
  // delete campaign
  // close campaign
}
