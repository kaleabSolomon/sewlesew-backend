import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createApiResponse } from 'src/utils';

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
    campaign: true,
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

  // async createAccount();
  // async createAccount();
}
