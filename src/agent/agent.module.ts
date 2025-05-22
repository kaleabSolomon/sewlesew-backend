import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { SmsService } from 'src/sms/sms.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [AgentController],
  providers: [AgentService, EmailService, AuthService, SmsService],
})
export class AgentModule {}
