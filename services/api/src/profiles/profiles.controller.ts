import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('companies/:recruiterId')
  getPublicCompany(@Param('recruiterId') recruiterId: string) {
    return this.profilesService.getPublicCompany(recruiterId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profilesService.getByUserId(user.sub);
  }

  @Get('candidates/:userId')
  @UseGuards(JwtAuthGuard, OnboardingGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.RECRUITER)
  getCandidateForRecruiter(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.profilesService.getCandidateForRecruiter(user.sub, userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(user.sub, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    return this.profilesService.uploadAvatar(user.sub, file);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  removeAvatar(@CurrentUser() user: JwtPayload) {
    return this.profilesService.removeAvatar(user.sub);
  }

  @Post('me/banner')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { banner: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadBanner(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    return this.profilesService.uploadBanner(user.sub, file);
  }

  @Delete('me/banner')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  removeBanner(@CurrentUser() user: JwtPayload) {
    return this.profilesService.removeBanner(user.sub);
  }

  @Post('me/resume')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { resume: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadResume(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No resume uploaded');
    }
    return this.profilesService.uploadResume(user.sub, file);
  }

  @Delete('me/resume')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  removeResume(@CurrentUser() user: JwtPayload) {
    return this.profilesService.removeResume(user.sub);
  }

  @Post('me/company-logo')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { logo: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadCompanyLogo(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No logo uploaded');
    }
    return this.profilesService.uploadCompanyLogo(user.sub, file);
  }

  @Delete('me/company-logo')
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  @ApiBearerAuth()
  removeCompanyLogo(@CurrentUser() user: JwtPayload) {
    return this.profilesService.removeCompanyLogo(user.sub);
  }
}
