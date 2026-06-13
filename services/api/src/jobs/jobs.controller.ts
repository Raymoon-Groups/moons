import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { ListCompaniesDto } from './dto/list-companies.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { SuggestLocationsDto } from './dto/suggest-locations.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get('trending')
  trending() {
    return this.jobsService.findTrending();
  }

  @Get('companies/top')
  topCompanies() {
    return this.jobsService.findTopCompanies();
  }

  @Get('companies')
  listCompanies(@Query() query: ListCompaniesDto) {
    return this.jobsService.findCompanies(query);
  }

  @Get('locations/suggest')
  suggestLocations(@Query() query: SuggestLocationsDto) {
    const limit = Math.min(Math.max(Number(query.limit) || 8, 1), 12);
    return this.jobsService.suggestLocations(query.q, limit);
  }

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

  @Get('mine/stats')
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiBearerAuth()
  recruiterStats(@CurrentUser() user: JwtPayload) {
    return this.jobsService.getRecruiterStats(user.sub);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiBearerAuth()
  findMineOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.jobsService.findOwnedByRecruiter(user.sub, id);
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiBearerAuth()
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(user.sub, id, dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiBearerAuth()
  close(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.jobsService.close(user.sub, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiBearerAuth()
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.jobsService.delete(user.sub, id);
  }
}
