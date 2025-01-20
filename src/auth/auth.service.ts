import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  changeAdminPasswordDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerificationCodeResendDto,
  VerifyAccountDto,
} from './dto';
import * as argon from 'argon2';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import { SendEmailDto } from 'src/email/dto';
import * as crypto from 'crypto';
import { createApiResponse } from 'src/utils';
import { SmsService } from 'src/sms/sms.service';
import { RoleTypes } from 'src/common/enums';

type userNames = {
  familyName: string;
  givenName: string;
  middleName?: string;
};
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async localSignup(dto: SignUpDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            dto.email ? { email: dto.email } : undefined,
            dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : undefined,
          ].filter(Boolean), // Remove undefined entries
        },
      });

      if (user)
        throw new UnauthorizedException(
          'An Account is already registered with the given email. please Log in or register using a different email',
        );
      // format date
      dto.dateOfBirth = moment(dto.dateOfBirth).toISOString();

      const age = moment().diff(dto.dateOfBirth, 'years');

      if (age < 13 && age > 100)
        throw new BadRequestException(
          'You must be between the age of 13 and 100 years old',
        );
      // hash password
      const passwordHash = await this.hashData(dto.password);

      // save user to db
      const newUser = await this.prisma.user.create({
        data: {
          ...(dto.email && { email: dto.email }), // Include email only if it's provided
          ...(dto.phoneNumber && { phoneNumber: dto.phoneNumber }), // Include phoneNumber only if it's provided
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth,
          passwordHash,
        },
      });

      const verificationCode = this.generateVerificationCode();

      await this.saveVerificationCode(newUser.id, verificationCode);
      // genetate tokens
      const tokens = await this.generateTokens(
        newUser.id,
        newUser.isVerified,
        newUser.isActive,
        newUser.role,
        newUser.email,
        newUser.phoneNumber,
      );
      // hash refresh token and save to new user
      await this.updateRtHash(newUser.id, tokens.refresh_token, RoleTypes.USER);

      if (dto.email) {
        console.log('sending email');
        await this.sendVerificationEmail(newUser.email, verificationCode);
        console.log('sent email');
      } else if (dto.phoneNumber) {
        console.log('sending sms');
        await this.smsService.sendSMS(
          newUser.phoneNumber,
          `Your Sewlesew verificaton number is ${verificationCode}`,
        );
        console.log('sent sms');
      } else {
        throw new BadRequestException('Could not send verification message');
      }
      // return tokens
      return tokens;
    } catch (err) {
      console.log(err);
    }
  }
  async localSignin(dto: SignInDto) {
    //validate if user exists
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : undefined,
        ].filter(Boolean),
      },
    });
    if (!user || !user.isActive)
      throw new ForbiddenException('Incorrect Credentials');

    // validate if password matches
    const pwMatches = await argon.verify(user.passwordHash, dto.password);
    if (!pwMatches) throw new ForbiddenException('Incorrect Credentials');
    // generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.isVerified,
      user.isActive,
      user.role,
      user.email,
      user.phoneNumber,
    );
    // update rt
    await this.updateRtHash(user.id, tokens.refresh_token, RoleTypes.USER);
    // return tokens
    return tokens;
  }
  async logout(id: string, role: RoleTypes) {
    try {
      console.log(id);
      if (role == RoleTypes.USER) {
        await this.prisma.user.updateMany({
          where: { id, rtHash: { not: null } },
          data: { rtHash: null },
        });
      } else {
        await this.prisma.admin.updateMany({
          where: { id, rtHash: { not: null } },
          data: { rtHash: null },
        });
      }
      return {
        status: 'success',
        message: 'Logged out Successfully.',
      };
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }
  async refresh(id: string, refreshToken: string) {
    // get user
    const user = await this.prisma.user.findFirst({ where: { id } });

    if (!user) throw new ForbiddenException('Access Denied');
    // check if the refresh token and hashed rt in db match

    const rtMatches = await argon.verify(user.rtHash, refreshToken);

    if (!rtMatches) throw new ForbiddenException('Access Denied');

    // generate new tokens
    const tokens = await this.generateTokens(
      user.id,
      user.isVerified,
      user.isActive,
      user.role,
      user.email,
      user.phoneNumber,
    );

    await this.updateRtHash(user.id, tokens.refresh_token, RoleTypes.USER);
    return tokens;
  }

  async hashData(data: string): Promise<string> {
    return await argon.hash(data);
  }

  async generateTokens(
    userId: string,
    isVerified: boolean | null,
    isActive: boolean,
    role: string,
    email: string | null,
    phoneNumber: string | null,
  ) {
    const identifier = email || phoneNumber;

    if (!identifier)
      throw new BadRequestException(
        'Either an email or a phone number must be provided.',
      );
    const [at, rt] = await Promise.all([
      this.jwtService.sign(
        { sub: userId, identifier, isVerified, isActive, role },
        {
          secret: this.config.get('AT_SECRET'),
          expiresIn: this.config.get('AT_EXPIRESIN'),
        },
      ),
      this.jwtService.sign(
        { sub: userId, identifier, isVerified, isActive, role },
        {
          secret: this.config.get('RT_SECRET'),
          expiresIn: this.config.get('RT_EXPIRESIN'),
        },
      ),
    ]);
    return { access_token: at, refresh_token: rt };
  }

  async updateRtHash(userId: string, rt: string, target: RoleTypes) {
    const rtHash = await this.hashData(rt);

    if (target == RoleTypes.USER) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          rtHash,
        },
      });
    } else {
      await this.prisma.admin.update({
        where: { id: userId },
        data: {
          rtHash,
        },
      });
    }
  }

  async validateProviderUser(
    email: string,
    name: userNames,
    providerType: string,
    providerId: string,
    isVerified: boolean,
    profilePic?: string,
  ) {
    // Check if user with the given email exists
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        authProviders: {
          select: {
            id: true,
            providerId: true,
            providerType: true,
          },
        },
      },
    });

    if (user) {
      // Check if the auth provider is already linked
      const providerExists = user.authProviders.some(
        (provider) =>
          provider.providerType === providerType &&
          provider.providerId === providerId,
      );

      if (!providerExists) {
        // Add the new provider if it doesn't exist
        await this.prisma.authProvider.create({
          data: {
            userId: user.id,
            providerId,
            providerType,
          },
        });
      }

      return this.prisma.user.findUnique({
        where: { email },
        include: {
          authProviders: true,
        },
      });
    }

    // If the user doesn't exist, create them along with the provider
    return this.prisma.user.create({
      data: {
        firstName: name.givenName,
        lastName: name.familyName,
        email,
        isVerified,
        profilePicture: profilePic,
        authProviders: {
          create: {
            providerId,
            providerType,
          },
        },
      },
      include: {
        authProviders: true,
      },
    });
  }

  async saveVerificationCode(userId: string, verificationCode: number) {
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: {
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + 600000),
      },
    });
  }

  generateVerificationCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  async sendVerificationEmail(email: string, verificationCode: number) {
    const verificationEmailDto: SendEmailDto = {
      from: {
        name: 'Sewlesew',
        address: 'noreply@sewlesew.com',
      },
      recipient: email,
      subject: 'Verify Your Afalagi Account',
      html: `
       <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Sewlesew Fund Account</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #4CAF50;
            padding: 20px;
            text-align: center;
            color: #ffffff;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777777;
        }
        .verification-code {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Sewlesew Fund Account</h1>
        </div>
        <div class="content">
            <p>Dear User,</p>
            <p>Thank you for signing up with Sewlesew Fund. To complete your registration, please verify your email address by entering the following verification code:</p>
            <p class="verification-code">${verificationCode}</p>
            <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            <p>Thank you,<br>The Sewlesew Fund Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Sewlesew Fund. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    };
    try {
      const result = await this.emailService.sendEmail(verificationEmailDto);

      return { message: 'Email sent successfully', result };
    } catch (error) {
      return { message: 'Failed to send email', error };
    }
  }

  async verifyAccount(dto: VerifyAccountDto) {
    const { email, phoneNumber, verificationCode } = dto;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email } : undefined,
          dto.phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean),
      },
    });

    console.log(user);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified)
      throw new NotAcceptableException('Account is Already Verified');

    if (
      user.verificationCode !== verificationCode ||
      user.verificationCodeExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Mark email as verified in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    return createApiResponse({
      status: 'success',
      message: 'Verified account successfully',
      data: {},
    });
  }

  async resendVerificationCode(dto: VerificationCodeResendDto) {
    const verificationCode = this.generateVerificationCode();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : undefined,
        ].filter(Boolean),
      },
    });
    if (!user) throw new NotFoundException('user not found');
    if (user.isVerified) {
      throw new NotAcceptableException('Account is Already Verified');
    }
    await this.saveVerificationCode(user.id, verificationCode);

    if (dto.email) {
      const sentEmail = await this.sendVerificationEmail(
        dto.email,
        verificationCode,
      );
      if (!sentEmail)
        throw new InternalServerErrorException('Could not send email');
    } else if (dto.phoneNumber) {
      await this.smsService.sendSMS(
        dto.phoneNumber,
        `Your sewlesew verification code is ${verificationCode}`,
      );
    }

    return createApiResponse({
      status: 'success',
      message: 'Verification Code sent successfully',
      data: {},
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email, phoneNumber } = dto;
    // check if user exists
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean),
      },
    });
    if (!user) throw new NotFoundException('Account not found');
    // generate reset token

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // update the user with tokens
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpiresAt: resetTokenExpires,
      },
    });
    //TODO: do this when the front end is made. for now just send the token
    const resetUrl = `http://localhost:3000/auth/reset-password/${resetToken}`;
    // add this  // <a href="${resetUrl}">Reset Password</a>
    const emailSubject = 'Reset Your Password';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #333; background-color: #f0f8ff; padding: 20px; border-radius: 10px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background-color: #e6f2ff; padding: 20px; text-align: center; border-bottom: 1px solid #d1e7ff;">
            <h2 style="color: #007BFF; margin: 0;">Password Reset Request</h2>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; line-height: 1.5;">
              You requested a password reset. Please click on the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #007BFF; color: #ffffff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-size: 16px;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #666;">
              If you did not request a password reset, please ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;

    if (dto.email) {
      console.log('sending email');
      await this.emailService.sendEmail({
        from: {
          name: 'Afalagi',
          address: 'noreply@Afalagi.com',
        },

        recipient: email,
        subject: emailSubject,
        html: emailBody,
      });
      console.log('sent email');
    } else if (dto.phoneNumber) {
      console.log('sending sms');
      await this.smsService.sendSMS(
        user.phoneNumber,
        `Click the link to reset your password ${resetUrl}`,
      );
      console.log('sent sms');
    } else {
      throw new BadRequestException('Could not send reset url');
    }

    return createApiResponse({
      status: 'success',
      message: 'Sent reset url',
      data: {},
    });
  }

  async resetPassword(dto: ResetPasswordDto, resetToken: string) {
    const { newPassword } = dto;
    console.log(dto, resetToken);
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });

    console.log(user);
    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token.',
      );
    }

    const passwordHash = await this.hashData(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    return createApiResponse({
      status: 'success',
      message: 'Password reset successfully.',
      data: {},
    });
  }

  async changeUserPassword(id: string, dto: ChangePasswordDto) {
    const { newPassword, oldPassword } = dto;

    const user = await this.prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token.',
      );
    }

    const passwordMatches = await argon.verify(user.passwordHash, oldPassword);

    if (!passwordMatches)
      throw new ForbiddenException('old password is incorrect.');

    const passwordHash = await this.hashData(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
      },
    });

    return createApiResponse({
      status: 'success',
      message: 'Password changed successfully.',
      data: {},
    });
  }

  async changePasswordAdmin(dto: changeAdminPasswordDto, otlToken: string) {
    const { email, password } = dto;

    const otlTokenHash = crypto
      .createHash('sha256')
      .update(otlToken)
      .digest('hex');

    const admin = await this.prisma.admin.findFirst({
      where: {
        email,
        otlToken: otlTokenHash,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid or expired password token.');
    }
    const passwordHash = await this.hashData(password);

    await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash,
      },
    });

    return createApiResponse({
      status: 'success',
      message: 'Password set successfully.',
      data: {},
    });
  }

  async adminLocalSignin(dto: SignInDto) {
    //validate if user exists
    const admin = await this.prisma.admin.findFirst({
      where: {
        email: dto.email,
      },
    });
    if (!admin || !admin.isActive)
      throw new ForbiddenException('Incorrect Credentials');

    // validate if password matches
    const pwMatches = await argon.verify(admin.passwordHash, dto.password);
    if (!pwMatches) throw new ForbiddenException('Incorrect Credentials');
    // generate tokens
    const tokens = await this.generateTokens(
      admin.id,
      null,
      admin.isActive,
      admin.role,
      admin.email,
      null,
    );
    // update rt
    await this.updateRtHash(admin.id, tokens.refresh_token, RoleTypes.ADMIN);
    // return tokens
    return tokens;
  }

  async adminRefresh(id: string, refreshToken: string) {
    // get user
    const admin = await this.prisma.admin.findFirst({ where: { id } });

    if (!admin) throw new ForbiddenException('Access Denied');
    // check if the refresh token and hashed rt in db match

    const rtMatches = await argon.verify(admin.rtHash, refreshToken);

    if (!rtMatches) throw new ForbiddenException('Access Denied');

    // generate new tokens
    const tokens = await this.generateTokens(
      admin.id,
      null,
      admin.isActive,
      admin.role,
      admin.email,
      null,
    );

    await this.updateRtHash(admin.id, tokens.refresh_token, RoleTypes.ADMIN);
    return tokens;
  }
}

// TODO: what if some on uses oauth after loging in with phone?????
