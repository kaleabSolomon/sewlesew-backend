import {
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
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerificationCodeResendDto,
  VerifyAccountDto,
} from './dto';
import { GoogleAuthGuard, RtGuard } from './guards';
import { userReq } from 'src/common/types';
import { Request, Response } from 'express';
import { RoleTypes } from 'src/common/enums';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @NoAuth()
  @HttpCode(HttpStatus.CREATED)
  @Post('/local/signup')
  async localSignup(@Body() dto: SignUpDto) {
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
    return await this.authService.logout(userId, RoleTypes.USER);
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
  @Post('/verify-account')
  async verifyAccount(@Body() dto: VerifyAccountDto) {
    return await this.authService.verifyAccount(dto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('/verify-account/resend')
  async resendVerificationCode(@Body() dto: VerificationCodeResendDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @HttpCode(HttpStatus.OK)
  @NoAuth()
  @Post('/forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(dto);
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

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('admin/local/signin')
  async adminLocalSignin(@Body() dto: SignInDto) {
    const tokens = await this.authService.adminLocalSignin(dto);
    return tokens;
  }

  @HttpCode(HttpStatus.OK)
  @Post('admin/logout')
  async adminLogout(@GetCurrentUser('userId') userId: string) {
    return await this.authService.logout(userId, RoleTypes.ADMIN);
  }

  @HttpCode(HttpStatus.OK)
  @NoAuth()
  @UseGuards(RtGuard)
  @Post('admin/refresh')
  async adminRefresh(@GetCurrentUser() user: userReq) {
    const tokens = await this.authService.adminRefresh(
      user['userId'],
      user['refreshToken'],
    );
    return tokens;
  }
}
