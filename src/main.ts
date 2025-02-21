import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [
      'https://sewlesew.vercel.app/',
      'https://sewlesew-frontend.vercel.app',
      'https://sewlesew-frontend-kbslmns-projects.vercel.app/',
      'https://sewlesew-frontend-git-main-kbslmns-projects.vercel.app/',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('/api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const port = configService.get<number>('PORT', 3333);
  await app.listen(port);
}
bootstrap();
