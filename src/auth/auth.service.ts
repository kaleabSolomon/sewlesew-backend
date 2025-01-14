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
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from './dto';
import * as argon from 'argon2';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import { SendEmailDto } from 'src/email/dto';
import * as crypto from 'crypto';

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
  ) {}

  async localSignup(dto: SignUpDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (user)
      throw new UnauthorizedException(
        'An Account is already registered with the given email. please Log in or register using a different email',
      );
    // hash password
    const passwordHash = await this.hashData(dto.password);

    // format date

    dto.dateOfBirth = moment(dto.dateOfBirth).toISOString();

    const age = moment().diff(dto.dateOfBirth, 'years');

    if (age < 13 && age > 100)
      throw new BadRequestException(
        'You must be between the age of 13 and 100 years old',
      );

    // save user to db
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
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
      newUser.email,
      newUser.isVerified,
      newUser.isActive,
      newUser.role,
    );
    // hash refresh token and save to new user
    await this.updateRtHash(newUser.id, tokens.refresh_token);
    // send email asking to verify the email
    await this.sendVerificationEmail(newUser.email, verificationCode);
    // return tokens
    return tokens;
  }
  async localSignin(dto: SignInDto) {
    //validate if user exists
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (!user || !user.isActive)
      throw new ForbiddenException('Incorrect Credentials');

    // validate if password matches
    const pwMatches = await argon.verify(user.passwordHash, dto.password);
    if (!pwMatches) throw new ForbiddenException('Incorrect Credentials');
    // generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.isVerified,
      user.isActive,
      user.role,
    );
    // update rt
    await this.updateRtHash(user.id, tokens.refresh_token);
    // return tokens
    return tokens;
  }
  async logout(id: string) {
    try {
      await this.prisma.user.updateMany({
        where: { id, rtHash: { not: null } },
        data: { rtHash: null },
      });

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
      user.email,
      user.isVerified,
      user.isActive,
      user.role,
    );

    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async hashData(data: string): Promise<string> {
    return await argon.hash(data);
  }

  async generateTokens(
    userId: string,
    email: string,
    isVerified: boolean,
    isActive: boolean,
    role: string,
  ) {
    const [at, rt] = await Promise.all([
      this.jwtService.sign(
        { sub: userId, email, isVerified, isActive, role },
        {
          secret: this.config.get('AT_SECRET'),
          expiresIn: this.config.get('AT_EXPIRESIN'),
        },
      ),
      this.jwtService.sign(
        { sub: userId, email, isVerified, isActive, role },
        {
          secret: this.config.get('RT_SECRET'),
          expiresIn: this.config.get('RT_EXPIRESIN'),
        },
      ),
    ]);
    return { access_token: at, refresh_token: rt };
  }

  async updateRtHash(userId: string, rt: string) {
    const rtHash = await this.hashData(rt);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        rtHash,
      },
    });
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
        AuthProviders: {
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
      const providerExists = user.AuthProviders.some(
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
          AuthProviders: true,
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
        AuthProviders: {
          create: {
            providerId,
            providerType,
          },
        },
      },
      include: {
        AuthProviders: true,
      },
    });
  }

  async saveVerificationCode(userId: string, emailVerificationCode: number) {
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: {
        emailVerificationCode,
        emailVerificationCodeExpiresAt: new Date(Date.now() + 600000),
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

  async verifyEmail(dto: VerifyEmailDto): Promise<boolean> {
    const { email, verificationCode } = dto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isVerified)
      throw new NotAcceptableException('Account is Already Verified');

    if (
      user.emailVerificationCode !== verificationCode ||
      user.emailVerificationCodeExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Mark email as verified in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationCode: null,
        emailVerificationCodeExpiresAt: null,
      },
    });

    return true;
  }

  async resendVerificationEmail(email: string) {
    const verificationCode = this.generateVerificationCode();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('user not found');
    if (user.isVerified) {
      throw new NotAcceptableException('Account is Already Verified');
    }
    await this.saveVerificationCode(user.id, verificationCode);
    const sentEmail = await this.sendVerificationEmail(email, verificationCode);
    if (!sentEmail)
      throw new InternalServerErrorException('Could not send email');
    return { message: sentEmail.message };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;
    // check if user exists
    const user = await this.prisma.user.findFirst({
      where: { email },
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
      where: { email },
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

    await this.emailService.sendEmail({
      from: {
        name: 'Afalagi',
        address: 'noreply@Afalagi.com',
      },

      recipient: email,
      subject: emailSubject,
      html: emailBody,
    });
  }

  async resetPassword(dto: ResetPasswordDto, resetToken: string) {
    const { newPassword } = dto;

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
  }
}
