import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EmailService } from 'src/email/email.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AdminController],
  providers: [AdminService, EmailService, ConfigModule],
})
export class AdminModule {}
