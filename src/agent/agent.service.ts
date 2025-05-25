import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/createAgent.dto';
import * as moment from 'moment';
import * as crypto from 'crypto';
import { AuthService } from 'src/auth/auth.service';
import { SendEmailDto } from 'src/email/dto';
import { createApiResponse } from 'src/utils';

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private emailService: EmailService,
    private readonly authService: AuthService,
  ) {}
  async createAgent(
    dto: CreateAgentDto,
    idFront: string,
    idBack: string,
    adminId: string,
  ) {
    try {
      console.log('......INIT,,,,,,,,');
      // Format date
      dto.dateOfBirth = moment(dto.dateOfBirth).toISOString();

      // Validate age if needed
      const age = moment().diff(dto.dateOfBirth, 'years');
      if (age < 18) {
        throw new BadRequestException('Agent must be at least 18 years old');
      }

      console.log('......AGE PASS,,,,,,,,');

      // Check if agent already exists
      const agentExists = !!(await this.prisma.agent.findFirst({
        where: { email: dto.email },
      }));

      if (agentExists) {
        throw new ConflictException(
          'An agent is already registered with the given email.',
        );
      }

      console.log('......AGENT NONEXISTENT,,,,,,,,');

      // Generate semi-random password (first 4 characters of last name + first 4 of first name + 4 random chars)
      const lastName = dto.lastName.substring(0, 4).toLowerCase();
      const firstName = dto.firstName.substring(0, 4).toLowerCase();
      const randomChars = crypto.randomBytes(4).toString('hex');
      const password = `${lastName}${firstName}${randomChars}`;

      // Hash the password
      const passwordHash = await this.authService.hashData(password);

      console.log('......PASSWORD HASHED,,,,,,,,');

      // Create agent with hashed password
      const agent = await this.prisma.agent.create({
        data: {
          ...dto,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth,
          passwordHash,
          createdById: adminId,
          idFront,
          idBack,
        },
      });

      console.log('......USER CREATED,,,,,,,,');

      // Create email template
      const loginUrl = `${this.config.get<string>('FRONTEND_URL')}/login`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f0f8ff; padding: 20px; border-radius: 10px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background-color: #e6f2ff; padding: 20px; text-align: center; border-bottom: 1px solid #d1e7ff;">
              <h2 style="color: #007BFF; margin: 0;">Your Agent Account Credentials</h2>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 16px; line-height: 1.5;">
                Welcome to our system! Your agent account has been created. You can log in with the following credentials:
              </p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #007BFF; padding: 15px; margin: 15px 0;">
                <p><strong>Email:</strong> ${agent.email}</p>
                <p><strong>Temporary Password:</strong> ${password}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.5;">
                For security reasons, you will be required to change your password after your first login.
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${loginUrl}" style="background-color: #007BFF; color: #ffffff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-size: 16px;">Login Now</a>
              </div>
              <p style="font-size: 14px; color: #666;">
                If you did not expect this email, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      `;

      // Send email with credentials
      const emailDto: SendEmailDto = {
        from: {
          name: this.config.get<string>('APP_NAME'),
          address: this.config.get<string>('DEFAULT_MAIL_FROM'),
        },
        recipient: agent.email,
        subject: 'Your New Agent Account',
        html: emailBody,
      };
      await this.emailService.sendEmail(emailDto);

      console.log('......EMAIL SENT,,,,,,,,');

      return createApiResponse({
        status: 'success',
        message: 'Agent created successfully',
        data: {
          id: agent.id,
          email: agent.email,
          firstName: agent.firstName,
          lastName: agent.lastName,
          role: agent.role,
          createdAt: agent.createdAt,
          country: agent.country,
          state: agent.state,
          city: agent.city,
          street: agent.street,
          postalCode: agent.postalCode,
        },
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getAllAgents(search?: string) {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
          ],

          isDeleted: false,
        }
      : {
          isDeleted: false,
        };

    const agents = await this.prisma.agent.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        role: true,
        city: true,
        country: true,
        state: true,
        street: true,
        postalCode: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        isDeleted: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return createApiResponse({
      status: 'success',
      message: 'Agents fetched successfully',
      data: agents,
    });
  }

  async getAgentById(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!agent) {
      throw new BadRequestException('Agent not found');
    }

    return createApiResponse({
      status: 'success',
      message: 'Agent fetched successfully',
      data: agent,
    });
  }

  async getAgentsCreatedByAdmin(adminId: string, search?: string) {
    const where = {
      createdById: adminId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const agents = await this.prisma.agent.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return createApiResponse({
      status: 'success',
      message: 'Agents fetched successfully',
      data: agents,
    });
  }

  async updateAgent(id: string, dto: UpdateAgentDto) {
    try {
      // Format date if provided
      if (dto.dateOfBirth) {
        dto.dateOfBirth = moment(dto.dateOfBirth).toISOString();

        // Validate age if needed
        const age = moment().diff(dto.dateOfBirth, 'years');
        if (age < 18) {
          throw new BadRequestException('Agent must be at least 18 years old');
        }
      }

      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new BadRequestException('Agent not found');
      }
      console.log(dto);
      const updatedAgent = await this.prisma.agent.update({
        where: { id },
        data: dto,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return createApiResponse({
        status: 'success',
        message: 'Agent updated successfully',
        data: updatedAgent,
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async resetAgentPassword(id: string) {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new BadRequestException('Agent not found');
      }

      // Generate semi-random password (first 4 characters of last name + first 4 of first name + 4 random chars)
      const lastName = agent.lastName.substring(0, 4).toLowerCase();
      const firstName = agent.firstName.substring(0, 4).toLowerCase();
      const randomChars = crypto.randomBytes(4).toString('hex');
      const password = `${lastName}${firstName}${randomChars}`;

      // Hash the password
      const passwordHash = await this.authService.hashData(password);

      // Update agent with new password and set hasVerified to false
      await this.prisma.agent.update({
        where: { id },
        data: {
          passwordHash,
          isVerified: false,
        },
      });

      // Create email template
      const loginUrl = `${this.config.get<string>('FRONTEND_URL')}/login`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f0f8ff; padding: 20px; border-radius: 10px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background-color: #e6f2ff; padding: 20px; text-align: center; border-bottom: 1px solid #d1e7ff;">
              <h2 style="color: #007BFF; margin: 0;">Password Reset</h2>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 16px; line-height: 1.5;">
                Your agent account password has been reset. You can log in with the following credentials:
              </p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #007BFF; padding: 15px; margin: 15px 0;">
                <p><strong>Email:</strong> ${agent.email}</p>
                <p><strong>New Temporary Password:</strong> ${password}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.5;">
                For security reasons, you will be required to change your password after logging in.
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${loginUrl}" style="background-color: #007BFF; color: #ffffff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-size: 16px;">Login Now</a>
              </div>
              <p style="font-size: 14px; color: #666;">
                If you did not expect this email, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      `;

      // Send email with credentials
      const emailDto: SendEmailDto = {
        from: {
          name: this.config.get<string>('APP_NAME'),
          address: this.config.get<string>('DEFAULT_MAIL_FROM'),
        },
        recipient: agent.email,
        subject: 'Your Password Has Been Reset',
        html: emailBody,
      };
      await this.emailService.sendEmail(emailDto);

      return createApiResponse({
        status: 'success',
        message: 'Agent password reset successfully',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async banAgent(id: string) {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new BadRequestException('Agent not found');
      }

      if (!agent.isActive) {
        throw new BadRequestException('Agent is already banned');
      }

      await this.prisma.agent.update({
        where: { id },
        data: { isActive: false },
      });

      return createApiResponse({
        status: 'success',
        message: 'Agent banned successfully',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async unbanAgent(id: string) {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new BadRequestException('Agent not found');
      }

      if (agent.isActive) {
        throw new BadRequestException('Agent is already active');
      }

      await this.prisma.agent.update({
        where: { id },
        data: { isActive: true },
      });

      return createApiResponse({
        status: 'success',
        message: 'Agent unbanned successfully',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async deleteAgent(id: string) {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id, isDeleted: false },
      });
      if (!agent) {
        throw new BadRequestException('Agent not found');
      }

      await this.prisma.agent.update({
        where: { id },
        data: { isDeleted: true },
      });

      return createApiResponse({
        status: 'success',
        message: 'Agent deleted successfully',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
