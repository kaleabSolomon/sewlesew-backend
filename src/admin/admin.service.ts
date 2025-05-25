import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'crypto';
import * as moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto, UpdateAdminDto } from './dto';
import { EmailService } from 'src/email/email.service';
import { SendEmailDto } from 'src/email/dto';
import { ConfigService } from '@nestjs/config';
import { createApiResponse } from 'src/utils';
import { AdminRoles } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  async createAdmin(dto: CreateAdminDto) {
    try {
      // format date
      dto.dateOfBirth = moment(dto.dateOfBirth).toISOString();

      const age = moment().diff(dto.dateOfBirth, 'years');

      if (age < 20 && age > 45)
        throw new BadRequestException(
          'You must be between the age of 13 and 100 years old',
        );
      const adminExists = !!(await this.prisma.admin.findFirst({
        where: { email: dto.email },
      }));
      if (adminExists)
        throw new ConflictException(
          'An Account is already registered with the given email.',
        );

      await this.prisma.admin.create({ data: dto });

      const otlToken = crypto.randomBytes(32).toString('hex');
      const otlTokenHash = crypto
        .createHash('sha256')
        .update(otlToken)
        .digest('hex');

      const otlTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // send the email

      const admin = await this.prisma.admin.update({
        where: { email: dto.email },
        data: { otlToken: otlTokenHash, otlTokenExpiresAt },
      });
      const resetUrl = `http://localhost:5147/auth/reset-password/${otlToken}`;

      const emailBody = `
    <div style="font-family: Arial, sans-serif; color: #333; background-color: #f0f8ff; padding: 20px; border-radius: 10px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background-color: #e6f2ff; padding: 20px; text-align: center; border-bottom: 1px solid #d1e7ff;">
          <h2 style="color: #007BFF; margin: 0;">Password Reset Request</h2>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; line-height: 1.5;">
            Finish Setting up Your Account. Click the link and create your password:
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

      const emailDto: SendEmailDto = {
        from: {
          name: this.config.get<string>('APP_NAME'),
          address: this.config.get<string>('DEFAULT_MAIL_FROM'),
        },

        recipient: admin.email,
        subject: 'Finish setting up Your Account',
        html: emailBody,
      };
      await this.emailService.sendEmail(emailDto);

      return createApiResponse({
        status: 'success',
        message: 'Created Admin Successfully',
        data: admin,
      });
    } catch (err) {
      console.log(err);
    }
  }

  // delete admin

  async deleteAdmin(id: string) {
    try {
      const admin = await this.prisma.admin.findFirst({ where: { id } });
      if (!admin)
        throw new NotFoundException('Admin with given id doesnot exist');

      await this.prisma.admin.update({
        where: { id },
        data: { isActive: false },
      });

      return createApiResponse({
        status: 'success',
        message: 'Deleted Admin Successfully.',
        data: {},
      });
    } catch (err) {
      console.log(err);
    }
  }

  // update admin

  async updateAdmin(dto: UpdateAdminDto) {
    try {
      const { id, ...data } = dto;

      if (!data) return 'please Insert data to be updated.';

      const admin = await this.prisma.admin.findFirst({ where: { id } });

      if (!admin) throw new NotFoundException('Couldnot Find Admin');

      const updatedAdmin = await this.prisma.admin.update({
        where: { id },
        data,
      });

      return createApiResponse({
        status: 'success',
        message: 'Updated admin data successfully.',
        data: updatedAdmin,
      });
    } catch (err) {
      console.log(err);
    }
  }

  // get all admins

  async getAdmins(page: number, limit: number, email?: string) {
    try {
      const skip = (page - 1) * limit;
      const take = limit;

      const admins = await this.prisma.admin.findMany({
        skip: skip,
        take: take,
        where: {
          email,
          OR: [
            { role: AdminRoles.CALLCENTERAGENT },
            { role: AdminRoles.CAMPAIGNREVIEWER },
          ],
        },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      if (!admins) throw new BadRequestException('Couldnot find admins');

      const totalAdmins = await this.prisma.admin.count({
        where: {
          email,
          OR: [
            { role: AdminRoles.CALLCENTERAGENT },
            { role: AdminRoles.CAMPAIGNREVIEWER },
          ],
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'Fetched admins successfully',
        data: admins,
        metadata: {
          totalItems: totalAdmins,
          totalPages: Math.ceil(totalAdmins / limit),
          pageSize: limit,
          currentPage: page,
        },
      });
    } catch (err) {
      console.log(err);
    }
  }

  // get admin by id

  async getAdminById(id: string) {
    try {
      const admin = await this.prisma.admin.findFirst({
        where: {
          id,
        },
      });

      if (!admin) throw new NotFoundException('Could not find admin');

      return createApiResponse({
        status: 'success',
        message: 'Admin Found',
        data: admin,
      });
    } catch (err) {
      console.log(err);
    }
  }

  // TODO: allow admins to then chenge their passwords and log in.
}
