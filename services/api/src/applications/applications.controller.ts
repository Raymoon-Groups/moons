import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@ApiTags('applications')
@Controller('applications')
@UseGuards(JwtAuthGuard, OnboardingGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CANDIDATE)
  apply(@CurrentUser() user: JwtPayload, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user.sub, dto);
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CANDIDATE)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.findByCandidate(user.sub);
  }

  @Get('mine/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CANDIDATE)
  candidateStats(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.getCandidateStats(user.sub);
  }

  @Get('check')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CANDIDATE)
  checkApplied(
    @CurrentUser() user: JwtPayload,
    @Query('jobId') jobId: string,
  ) {
    return this.applicationsService.hasApplied(user.sub, jobId);
  }

  @Get('recruiter/candidates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  listCandidatesForRecruiter(
    @CurrentUser() user: JwtPayload,
    @Query('q') q?: string,
    @Query('jobId') jobId?: string,
    @Query('status') status?: ApplicationStatus,
    @Query('location') location?: string,
    @Query('experienceMin') experienceMin?: string,
    @Query('experienceMax') experienceMax?: string,
    @Query('noticePeriod') noticePeriod?: string,
  ) {
    return this.applicationsService.findCandidatesForRecruiter(user.sub, {
      q,
      jobId,
      status,
      location,
      experienceMin: experienceMin != null && experienceMin !== '' ? Number(experienceMin) : undefined,
      experienceMax: experienceMax != null && experienceMax !== '' ? Number(experienceMax) : undefined,
      noticePeriod,
    });
  }

  @Get('job/:jobId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  listForJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.applicationsService.findByJob(jobId, user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CANDIDATE)
  withdraw(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.applicationsService.withdraw(id, user.sub);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, user.sub, dto.status);
  }
}
