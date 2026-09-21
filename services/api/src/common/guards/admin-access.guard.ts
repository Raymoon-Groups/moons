import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  extractAdminPortalTokenFromRequest,
  verifyAdminPortalPayload,
} from '../../auth/admin-portal-auth';
import { extractAccessTokenFromRequest } from '../../auth/auth-cookies';
import { isAdminEmail } from './admin.guard';

function accessSecret() {
  return (
    process.env.JWT_ACCESS_SECRET ??
    'moons-dev-access-secret-change-in-production'
  );
}

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = accessSecret();

    const portalToken = extractAdminPortalTokenFromRequest(request);
    if (portalToken) {
      try {
        const payload = this.jwtService.verify(portalToken, { secret });
        if (verifyAdminPortalPayload(payload)) {
          request.user = {
            sub: 'admin-portal',
            email: '',
            adminPortal: true,
          };
          return true;
        }
      } catch {
        // fall through to user JWT
      }
    }

    const token = extractAccessTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException('Admin login required');
    }

    let payload: { email?: string; sub?: string };
    try {
      payload = this.jwtService.verify(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const email = String(payload.email ?? '').trim().toLowerCase();
    if (!email || !isAdminEmail(email)) {
      throw new ForbiddenException('Admin access required');
    }

    request.user = payload;
    return true;
  }
}
