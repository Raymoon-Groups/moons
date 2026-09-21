import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AbuseReportStatus } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { THROTTLE } from '../common/throttle.constants';
import { CreateAbuseReportDto } from './dto/create-abuse-report.dto';
import { UpdateAbuseReportStatusDto } from './dto/update-abuse-report-status.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  @Throttle(THROTTLE.publicForm)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAbuseReportDto) {
    return this.reports.create(user.sub, dto);
  }

  @Get('admin')
  @UseGuards(AdminAccessGuard)
  listAdmin(
    @Query('status') status?: AbuseReportStatus,
    @Query('limit') limit?: string,
  ) {
    return this.reports.listForAdmin(status, Number(limit) || 50);
  }

  @Patch('admin/:id')
  @UseGuards(AdminAccessGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAbuseReportStatusDto,
  ) {
    return this.reports.updateStatus(id, dto.status);
  }
}
