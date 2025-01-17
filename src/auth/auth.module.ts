import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy, GoogleStrategy, RtStrategy } from './strategies';
import { EmailService } from 'src/email/email.service';
import { SmsService } from 'src/sms/sms.service';

@Module({
  imports: [JwtModule.register({ global: true })],
  providers: [
    AuthService,
    AtStrategy,
    RtStrategy,
    EmailService,
    GoogleStrategy,
    SmsService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
