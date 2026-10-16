import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('admin/overview')
  @UseGuards(AdminAccessGuard)
  overview(@Query('days') days?: string) {
    return this.analytics.getAdminOverview(Number(days) || 14);
  }
}
