import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/CreateComment.dto';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post('/post')
  @Roles(Role.USER)
  async createPostComment(
    @GetCurrentUser('userId') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    console.log(dto);
    return await this.commentService.createCampaignComment(userId, dto);
  }
  @Post('/testimonial')
  @Roles(Role.USER)
  async createStoryComment(
    @GetCurrentUser('userId') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    console.log(dto);
    return await this.commentService.createTestimonialComment(userId, dto);
  }

  @Get('/campaign/:campaignId')
  async getCampaignComments(
    @Param('campaignId') campaignId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('parentOnly', new DefaultValuePipe('false')) parentOnly: string,
  ) {
    const isParentOnly = parentOnly === 'true';
    return await this.commentService.getCampaignComments(
      campaignId,
      page,
      limit,
      isParentOnly,
    );
  }

  @Get('/:commentId/replies')
  async getCommentReplies(
    @Param('commentId') commentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.commentService.getCommentReplies(commentId, page, limit);
  }

  @Get('/testimonial/:testimonialId')
  async getTestimonialComments(
    @Param('testimonialId') testimonialId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('parentOnly', new DefaultValuePipe('false')) parentOnly: string,
  ) {
    const isParentOnly = parentOnly === 'true';
    return await this.commentService.getTestimonialComments(
      testimonialId,
      page,
      limit,
      isParentOnly,
    );
  }
  //   @Patch(':commentId')
  //   @Roles(Role.USER)
  //   async editComment(
  //     @Body() dto: EditCommentDto,
  //     @Param('commentId') commentId: string,
  //     @GetCurrentUser('userId') userId: string,
  //   ) {
  //     return await this.commentService.editComment(dto, commentId, userId);
  //   }

  //   @Patch('delete/:commentId')
  //   @Roles(Role.USER)
  //   async removeComment(
  //     @Param('commentId') commentId: string,
  //     @GetCurrentUser('userId') userId: string,
  //   ) {
  //     return await this.commentService.deleteComment(userId, commentId);
  //   }

  //TODO: implement  getting replies
}
