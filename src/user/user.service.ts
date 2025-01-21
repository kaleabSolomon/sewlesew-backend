import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import { createApiResponse } from 'src/utils';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  returnableFieldsUser = {
    id: true,
    email: true,
    phoneNumber: true,
    createdAt: true,
    updatedAt: true,
    isActive: true,
    role: true,
    isVerified: true,
    dateOfBirth: true,
    firstName: true,
    lastName: true,
    profilePicture: true,
    campaigns: true,
  };

  async getAllUsers(page: number, limit: number) {
    // calculate offsets
    const skip = (page - 1) * limit;
    const take = limit;

    const users = await this.prisma.user.findMany({
      skip: skip,
      take: take,
      select: this.returnableFieldsUser,
    });
    if (!users) throw new NotFoundException('could not fetch users');

    const totalUsers = await this.prisma.user.count();
    return createApiResponse({
      status: 'success',
      message: 'Successfully fetched users',
      data: users,
      metadata: {
        total: totalUsers,
        pageSize: limit,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      },
    });
  }
  async getUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      select: this.returnableFieldsUser,
    });

    if (!user) throw new NotFoundException("couldn't find user");
    return createApiResponse({
      status: 'success',
      message: 'Successfully fetched user.',
      data: user,
    });
  }

  async deleteAccount(id: string) {
    try {
      const user = await this.prisma.user.findFirst({ where: { id } });
      if (!user) throw new NotFoundException('user not found');
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false, rtHash: null },
      });

      return createApiResponse({
        status: 'success',
        message: 'deleted account.',
        data: {},
      });
    } catch (err) {
      console.log(err);
    }
  }

  // async createUser(dto: CreateUserDto) {
  //   try {
  //     const { email, phoneNumber } = dto;

  //     const user = await this.prisma.user.findFirst({
  //       where: {
  //         OR: [
  //           email ? { email } : undefined,
  //           phoneNumber ? { phoneNumber } : undefined,
  //         ].filter(Boolean),
  //       },
  //     });

  //     if (user) {
  //       throw new ConflictException(
  //         'User with given credential already exists',
  //       );
  //     }

  //     dto.dateOfBirth = moment(dto.dateOfBirth).toISOString();

  //     const age = moment().diff(dto.dateOfBirth, 'years');

  //     if (age < 13 && age > 100)
  //       throw new BadRequestException(
  //         'You must be between the age of 13 and 100 years old',
  //       );

  //     const newUser = await this.prisma.user.create({
  //       data: {
  //         ...dto,
  //       },
  //     });

  //     return createApiResponse({
  //       status: 'success',
  //       message: 'Created User Successfully. ',
  //       data: newUser,
  //     });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  async editUser(dto: EditUserDto, id: string, profilePicture?: string) {
    try {
      if (dto.dateOfBirth) {
        dto.dateOfBirth = moment(dto.dateOfBirth).toISOString();

        const age = moment().diff(dto.dateOfBirth, 'years');

        if (age < 13 && age > 100)
          throw new BadRequestException(
            'You must be between the age of 13 and 100 years old',
          );
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: { ...dto, profilePicture },
      });

      if (!user) throw new BadRequestException('Could not Update User Data');

      return createApiResponse({
        status: 'success',
        message: 'Updated user successfully',
        data: user,
      });
    } catch (err) {
      console.log(err);
    }
  }
}
