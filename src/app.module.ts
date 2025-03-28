import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './auth/guards';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { SmsModule } from './sms/sms.module';
import { ModerationModule } from './moderation/moderation.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { CampaignModule } from './campaign/campaign.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CampaignSchedulerService } from './scheduler/campaignScheduler.service';
import { CampaignSchedulerModule } from './scheduler/campaignScheduler.module';
import { ChapaModule } from 'chapa-nestjs';
import { DonationModule } from './donation/donation.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    EmailModule,
    UserModule,
    AdminModule,
    SmsModule,
    ModerationModule,
    CloudinaryModule,
    CampaignModule,
    CampaignSchedulerModule,
    ChapaModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secretKey: configService.get('CHAPA_TEST_SECRET_KEY'),
      }),
    }),
    DonationModule,
    StatsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    CampaignSchedulerService,
  ],
})
export class AppModule {}
