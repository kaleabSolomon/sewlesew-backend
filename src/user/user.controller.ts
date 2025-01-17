import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

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

  @Get(':id')
  @Roles(Role.SUPERADMIN)
  async getUser(@Param('id') id: string) {
    return await this.userService.getUser(id);
  }
  @Get('/me')
  @Roles(Role.USER)
  async getOwnUserData(@GetCurrentUser('id') id: string) {
    return await this.userService.getUser(id);
  }
  // create user

  // edit user

  // delete user

  // chagne password

  //
}
