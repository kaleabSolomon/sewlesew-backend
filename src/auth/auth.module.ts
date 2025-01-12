import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy, GoogleStrategy, RtStrategy } from './strategies';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [JwtModule.register({ global: true })],
  providers: [
    AuthService,
    AtStrategy,
    RtStrategy,
    EmailService,
    GoogleStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
