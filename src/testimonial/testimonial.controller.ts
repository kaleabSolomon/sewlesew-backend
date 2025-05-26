import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TestimonialService } from './testimonial.service';
import { Role } from 'src/common/enums';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { userReq } from 'src/common/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateTestimonialDto } from './dto/createTestimonial.dto';
import { OptionalAuth } from 'src/common/decorators/optionalAuth.decorator';

@Controller('testimonial')
export class TestimonialController {
  constructor(
    private readonly testimonialService: TestimonialService,
    private cloudinary: CloudinaryService,
  ) {}

  @Post()
  @Roles(Role.CALLCENTERAGENT, Role.USER)
  @UseInterceptors(FileInterceptor('coverImage'))
  async createTestimonial(
    @UploadedFile() coverImage: Express.Multer.File,
    @Body() dto: CreateTestimonialDto,
    @GetCurrentUser() user: userReq,
  ) {
    try {
      let img: UploadApiResponse | UploadApiErrorResponse | undefined;

      if (coverImage) {
        img = await this.cloudinary.uploadFile(coverImage);

        if (!img || !img.url) {
          throw new InternalServerErrorException(
            'Failed to upload cover photo',
          );
        }
      }

      return await this.testimonialService.createTestimonial(
        user.userId,
        dto,
        img.url,
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  @OptionalAuth()
  @Get()
  async getSuccessStories(
    @GetCurrentUser('userId') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('title') title?: string,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 5);

    const filters = {
      title,
    };
    return await this.testimonialService.getTestimonials(
      userId,
      page,
      limit,
      filters,
    );
  }
}
