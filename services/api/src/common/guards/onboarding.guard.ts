import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    if (!userId) return true;

    const user = await this.usersService.findById(userId);
    if (user && !user.onboardingCompleted) {
      throw new ForbiddenException({
        message: 'Please complete onboarding before using this feature.',
        code: 'ONBOARDING_REQUIRED',
      });
    }

    return true;
  }
}
