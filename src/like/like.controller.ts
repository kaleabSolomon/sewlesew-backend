import { Controller, Param, Post } from '@nestjs/common';
import { LikeService } from './like.service';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';

@Controller('like')
export class LikeController {
  constructor(private likeService: LikeService) {}

  @Post('/campaign/:campaignId')
  @Roles(Role.USER)
  async likeCampaign(
    @GetCurrentUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return await this.likeService.toggleCampaignLike(userId, campaignId);
  }
  @Post('/story/:storyId')
  @Roles(Role.USER)
  async likeStory(
    @GetCurrentUser('userId') userId: string,
    @Param('storyId') storyId: string,
  ) {
    return await this.likeService.toggleStoryLike(userId, storyId);
  }
}
