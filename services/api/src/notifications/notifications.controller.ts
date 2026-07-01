import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { NotificationsService } from './notifications.service';

class ListNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, OnboardingGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListNotificationsDto) {
    return this.notificationsService.listForUser(user.sub, query.limit ?? 30);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.unreadCount(user.sub);
  }

  @Get('nav-indicators')
  navIndicators(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.navIndicators(user.sub);
  }

  @Get('bell')
  listBell(@CurrentUser() user: JwtPayload, @Query() query: ListNotificationsDto) {
    return this.notificationsService.listBellNotifications(user.sub, query.limit ?? 30);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Post('read-bell')
  markBellRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markBellNotificationsRead(user.sub);
  }
}
