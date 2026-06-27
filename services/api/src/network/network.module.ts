import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { ConnectionsService } from './connections.service';
import { NetworkController } from './network.controller';
import { NetworkProfilesService } from './network-profiles.service';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [NetworkController],
  providers: [ConnectionsService, RecommendationsService, NetworkProfilesService],
  exports: [ConnectionsService, RecommendationsService, NetworkProfilesService],
})
export class NetworkModule {}
