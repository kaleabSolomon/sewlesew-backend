import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';
import { CreateAdminDto, UpdateAdminDto } from './dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Roles(Role.SUPERADMIN)
  @Get(':adminId')
  async getAdmin(@Param('adminId') id: string) {
    return await this.adminService.getAdminById(id);
  }
  @Roles(Role.SUPERADMIN)
  @Post('')
  async createAdmin(@Body() dto: CreateAdminDto) {
    return await this.adminService.createAdmin(dto);
  }

  @Roles(Role.SUPERADMIN)
  @Delete('')
  async deleteAdmin(@Body() id: string) {
    return await this.adminService.deleteAdmin(id);
  }

  @Roles(Role.SUPERADMIN)
  @Patch('')
  async updateAdmin(@Body() dto: UpdateAdminDto) {
    return await this.adminService.updateAdmin(dto);
  }

  @Roles(Role.SUPERADMIN)
  @Get('')
  async getAdmins(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('email') email?: string,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);

    return await this.adminService.getAdmins(page, limit, email);
  }
}
