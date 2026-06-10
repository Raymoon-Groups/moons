import { Module } from '@nestjs/common';
import { OnboardingGuard } from '../common/guards/onboarding.guard';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, OnboardingGuard],
  exports: [UsersService, OnboardingGuard],
})
export class UsersModule {}
