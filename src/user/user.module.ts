import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/email/email.service';
import { SmsService } from 'src/sms/sms.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [UserController],
  providers: [UserService, AuthService, EmailService, SmsService],
})
export class UserModule {}
