import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  controllers: [],
  providers: [CloudinaryProvider],
})
export class CloudinaryModule {}
