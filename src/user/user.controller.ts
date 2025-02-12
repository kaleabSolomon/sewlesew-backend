import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';
import { ChangePasswordDto } from 'src/auth/dto';
import { AuthService } from 'src/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditUserDto } from './dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cloudinary: CloudinaryService,
  ) {}

  @Get('')
  @Roles(Role.SUPERADMIN)
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);
    return await this.userService.getAllUsers(page, limit);
  }

  @Get('/me')
  @Roles(Role.USER)
  async getOwnUserData(@GetCurrentUser('userId') userId: string) {
    console.log('user data' + userId);
    return await this.userService.getUser(userId);
  }
  @Get(':id')
  @Roles(Role.SUPERADMIN)
  async getUser(@Param('id') id: string) {
    return await this.userService.getUser(id);
  }

  // @Post('')
  // @Roles(Role.CALLCENTERAGENT)
  // async createUser(dto: CreateUserDto) {
  //   return await this.userService.createUser(dto);
  // }

  @Patch('')
  @Roles(Role.USER)
  @UseInterceptors(FileInterceptor('profileImg'))
  async editUser(
    @Body() dto: EditUserDto,
    @GetCurrentUser('userId') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      let media: UploadApiResponse | UploadApiErrorResponse | undefined;

      if (file) {
        media = await this.cloudinary.uploadFile(file);

        if (!media || !media.url) {
          throw new InternalServerErrorException(
            'Failed to upload profile picture',
          );
        }
      }

      console.log(media);

      return media?.url
        ? await this.userService.editUser(dto, id, media.url)
        : await this.userService.editUser(dto, id);
    } catch (err) {
      console.log(err);
    }
  }

  @Patch('/password')
  @Roles(Role.USER)
  async changeUserPassword(
    @GetCurrentUser('userId') id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return await this.authService.changeUserPassword(id, dto);
  }

  // delete user

  @Roles(Role.USER)
  @Delete('')
  async deleteAccount(@GetCurrentUser('userId') id: string) {
    return await this.userService.deleteAccount(id);
  }

  // chagne password by admins for users. will be sent through email or phone text

  //
}
