import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { JobsModule } from './jobs/jobs.module';
import { MessagesModule } from './messages/messages.module';
import { NetworkModule } from './network/network.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    ProfilesModule,
    JobsModule,
    ApplicationsModule,
    NotificationsModule,
    NetworkModule,
    MessagesModule,
    NewsletterModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}