import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';

@Module({
  controllers: [LikeController],
  providers: [LikeService]
})
export class LikeModule {}
