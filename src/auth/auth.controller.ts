import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { NoAuth } from 'src/common/decorators';
import { SignUpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('sayHi')
  async sayHi() {
    return 'HI MF';
  }

  @NoAuth()
  @HttpCode(HttpStatus.CREATED)
  @Post('/local/signup')
  async localSignup(@Body() dto: SignUpDto) {
    console.log(dto);
    const tokens = await this.authService.localSignup(dto);
    return tokens;
  }
  // @NoAuth()
  // @HttpCode(HttpStatus.OK)
  // @Post('/local/signin')
  // async localSignin(@Body() dto: SignInDto) {
  //   const tokens = await this.authService.localSignin(dto);
  //   return tokens;
  // }
  // @HttpCode(HttpStatus.OK)
  // @Post('/logout')
  // async logout(@GetCurrentUser('userId') userId: string, @Res() res: Response) {
  //   await this.authService.logout(userId);
  //   res.clearCookie('access_token');
  //   res.clearCookie('refresh_token');
  //   res.clearCookie('profile');
  //   res.clearCookie('verified');
  //   res.send({
  //     status: 'success',
  //     message: 'successfully logged out',
  //   });
  // }

  // @HttpCode(HttpStatus.OK)
  // @NoAuth()
  // @UseGuards(RtGuard)
  // @Post('/refresh')
  // async refresh(@GetCurrentUser() user: User) {
  //   const tokens = await this.authService.refresh(
  //     user['userId'],
  //     user['refreshToken'],
  //   );
  //   return tokens;
  // }
  // @NoAuth()
  // @UseGuards(GoogleAuthGuard)
  // @Get('/google/login')
  // signinGoogle() {
  //   return { msg: 'authenticating' };
  // }
  // @NoAuth()
  // @UseGuards(GoogleAuthGuard)
  // @Get('/google/redirect')
  // async handleRedirect(@Req() req: Request, @Res() res: Response) {
  //   const tokens = req.user;
  //   res.cookie('access_token', tokens['access_token']);
  //   res.cookie('refresh_token', tokens['refresh_token']);
  //   res.cookie('verified', tokens['verified']);
  //   res.cookie('profile', tokens['profile']);

  //   res.redirect('http://localhost:3000/');
  // }
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

  // @HttpCode(HttpStatus.OK)
  // @Post('/verify-email')
  // async verifyEmail(@Body() dto: VerifyEmailDto) {
  //   const isVerified = await this.authService.verifyEmail(dto);
  //   if (!isVerified) {
  //     throw new BadRequestException('Email verification failed');
  //   }
  //   return { message: 'Email verified successfully' };
  // }
  // @HttpCode(HttpStatus.OK)
  // @Post('/verify-email/resend')
  // async resendVerificationEmail(@Body() dto: EmailResendDto) {
  //   return this.authService.resendVerificationEmail(dto.email);
  // }

  // // @HttpCode(HttpStatus.OK)
  // // @Get("verification-status")
  // // async checkVerification(@GetCurrentUser()){
  // //   return this.authService.checkVerification()
  // // }

  // @HttpCode(HttpStatus.OK)
  // @NoAuth()
  // @Post('/forgot-password')
  // async forgotPassword(@Body() dto: ForgotPasswordDto) {
  //   await this.authService.forgotPassword(dto);
  //   return { message: 'Password reset email sent' };
  // }
  // @HttpCode(HttpStatus.OK)
  // @NoAuth()
  // @Post('/reset-password')
  // async resetPassword(
  //   @Body() dto: ResetPasswordDto,
  //   @Query('token') resetToken: string,
  // ) {
  //   await this.authService.resetPassword(dto, resetToken);
  //   return { message: 'Password successfully reset' };
  // }
}
