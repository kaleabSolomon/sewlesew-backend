import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';
import { CreateAgentDto, UpdateAgentDto } from './dto/createAgent.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private cloudinary: CloudinaryService,
  ) {}

  @Post()
  @Roles(Role.SUPERADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idFront', maxCount: 1 },
      { name: 'idBack', maxCount: 1 },
    ]),
  )
  async createAgent(
    @Body() dto: CreateAgentDto,
    @UploadedFiles()
    files: { idFront?: Express.Multer.File[]; idBack?: Express.Multer.File[] },
    @Request() req,
    @GetCurrentUser('userId') adminId: string,
  ) {
    const idFront: UploadApiResponse | UploadApiErrorResponse | undefined =
      await this.cloudinary.uploadFile(files.idFront[0]);
    const idBack: UploadApiResponse | UploadApiErrorResponse | undefined =
      await this.cloudinary.uploadFile(files.idBack[0]);
    if (!files.idFront || !files.idFront[0]) {
      throw new BadRequestException('ID front image is required');
    }

    if (!files.idBack || !files.idBack[0]) {
      throw new BadRequestException('ID back image is required');
    }

    // idFront and idBack are now declared and assigned above as const

    if (!idFront || !idBack || !idFront.url || !idBack.url) {
      throw new InternalServerErrorException('Failed to upload Id Images');
    }

    // const adminId = req.user.id;
    return this.agentService.createAgent(dto, idFront.url, idBack.url, adminId);
  }

  @Get()
  @Roles(Role.SUPERADMIN)
  async getAllAgents(@Query('search') search: string) {
    return this.agentService.getAllAgents(search);
  }

  @Get('my-agents')
  @Roles(Role.SUPERADMIN)
  async getMyAgents(@Request() req, @Query('search') search: string) {
    const adminId = req.user.id;
    return this.agentService.getAgentsCreatedByAdmin(adminId, search);
  }
  @Get('/me')
  @Roles(Role.CALLCENTERAGENT)
  async getMyProfile(@GetCurrentUser('userId') userId: string) {
    console.log(userId);
    return this.agentService.getAgentById(userId);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN)
  async getAgentById(@Param('id') id: string) {
    return this.agentService.getAgentById(id);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN)
  async updateAgent(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentService.updateAgent(id, dto);
  }

  @Patch(':id/reset-password')
  @Roles(Role.SUPERADMIN)
  async resetAgentPassword(@Param('id') id: string) {
    return this.agentService.resetAgentPassword(id);
  }

  @Patch(':id/ban')
  @Roles(Role.SUPERADMIN)
  async banAgent(@Param('id') id: string) {
    return this.agentService.banAgent(id);
  }

  @Patch(':id/unban')
  @Roles(Role.SUPERADMIN)
  async unbanAgent(@Param('id') id: string) {
    return this.agentService.unbanAgent(id);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  async deleteAgent(@Param('id') id: string) {
    return this.agentService.deleteAgent(id);
  }
}
