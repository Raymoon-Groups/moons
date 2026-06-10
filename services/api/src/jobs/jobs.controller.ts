import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  list(@Query() query: ListJobsDto) {
    return this.jobsService.findPublished(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiBearerAuth()
  listMine(@CurrentUser() user: JwtPayload) {
    return this.jobsService.findByRecruiter(user.sub);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiBearerAuth()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user.sub, dto);
  }
}
