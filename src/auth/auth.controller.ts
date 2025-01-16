import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { GetCurrentUser, NoAuth } from 'src/common/decorators';
import {
  EmailResendDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from './dto';
import { GoogleAuthGuard, RtGuard } from './guards';
import { userReq } from 'src/common/types';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @NoAuth()
  @HttpCode(HttpStatus.CREATED)
  @Post('/local/signup')
  async localSignup(@Body() dto: SignUpDto) {
    console.log(dto);
    const tokens = await this.authService.localSignup(dto);
    return tokens;
  }
  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('/local/signin')
  async localSignin(@Body() dto: SignInDto) {
    const tokens = await this.authService.localSignin(dto);
    return tokens;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(@GetCurrentUser('userId') userId: string) {
    return await this.authService.logout(userId);
  }

  @HttpCode(HttpStatus.OK)
  @NoAuth()
  @UseGuards(RtGuard)
  @Post('/refresh')
  async refresh(@GetCurrentUser() user: userReq) {
    const tokens = await this.authService.refresh(
      user['userId'],
      user['refreshToken'],
    );
    return tokens;
  }
  @NoAuth()
  @UseGuards(GoogleAuthGuard)
  @Get('/google/login')
  signinGoogle() {
    return { msg: 'authenticating' };
  }
  @NoAuth()
  @UseGuards(GoogleAuthGuard)
  @Get('/google/redirect')
  async handleRedirect(@Req() req: Request, @Res() res: Response) {
    const tokens = req.user;
    res.send(tokens);
    res.redirect('http://localhost:5174/');
  }
  // @NoAuth()
  // @UseGuards(GoogleAuthGuard)
  // @Get('/google/android/login')
  // signinGoogleAndroid() {
  //   return { msg: 'authenticating' };
  // }
  // @NoAuth()
  // @UseGuards(GoogleAuthGuard)
  // @Get('/google/android/redirect')
  // async handleRedirectAndroid(@Req() req: Request, @Res() res: Response) {
  //   const tokens = req.user;

  //   res.json(tokens);
  // }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const isVerified = await this.authService.verifyEmail(dto);
    if (!isVerified) {
      throw new BadRequestException('Email verification failed');
    }
    return { message: 'Email verified successfully' };
  }
  @HttpCode(HttpStatus.OK)
  @Post('/verify-email/resend')
  async resendVerificationEmail(@Body() dto: EmailResendDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @NoAuth()
  @Post('/forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: 'Password reset email sent' };
  }
  @HttpCode(HttpStatus.OK)
  @NoAuth()
  @Post('/reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Query('token') resetToken: string,
  ) {
    return await this.authService.resetPassword(dto, resetToken);
  }
}
