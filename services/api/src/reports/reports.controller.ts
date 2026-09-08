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
import { AdminGuard } from '../common/guards/admin.guard';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { THROTTLE } from '../common/throttle.constants';
import { CreateAbuseReportDto } from './dto/create-abuse-report.dto';
import { UpdateAbuseReportStatusDto } from './dto/update-abuse-report-status.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post()
  @UseGuards(OnboardingGuard)
  @Throttle(THROTTLE.publicForm)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAbuseReportDto) {
    return this.reports.create(user.sub, dto);
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  listAdmin(
    @Query('status') status?: AbuseReportStatus,
    @Query('limit') limit?: string,
  ) {
    return this.reports.listForAdmin(status, Number(limit) || 50);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAbuseReportStatusDto,
  ) {
    return this.reports.updateStatus(id, dto.status);
  }
}
