import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ModReq } from 'src/common/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { createApiResponse } from 'src/utils';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  // async createModLog(mod: ModReq) {
  //   try {
  //     const moderation = await this.prisma.moderation.create({
  //       data: { ...mod },
  //     });

  //     if (!moderation)
  //       throw new InternalServerErrorException('Couldnot log admin action');
  //     return createApiResponse({
  //       status: 'success',
  //       message: 'Logged admin action',
  //       data: moderation,
  //     });
  //   } catch (err) {
  //     console.log('couldnot log admin actions \n ' + err);
  //   }
  // }
}
