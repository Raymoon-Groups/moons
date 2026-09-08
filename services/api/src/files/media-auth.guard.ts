import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { extractAccessTokenFromRequest } from '../auth/auth-cookies';

export type MediaJwtPayload = {
  sub: string;
  email: string;
  role: string;
};

/**
 * Accepts Bearer, HttpOnly access cookie, or ?access_token= for <img>/<video>.
 * Announcements can be fetched anonymously (handled in the controller/service).
 */
@Injectable()
export class MediaAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<
      Request & { user?: MediaJwtPayload; mediaAllowAnonymous?: boolean }
    >();

    const category = String(req.params.category ?? '');
    if (category === 'announcements') {
      req.mediaAllowAnonymous = true;
    }

    const token = extractAccessTokenFromRequest(req);
    if (!token) {
      if (req.mediaAllowAnonymous) return true;
      throw new UnauthorizedException('Authentication required to access this file');
    }

    try {
      const payload = await this.jwt.verifyAsync<MediaJwtPayload & { ave?: number }>(
        token,
        {
          secret:
            process.env.JWT_ACCESS_SECRET ??
            'moons-dev-access-secret-change-in-production',
        },
      );
      await this.authService.assertAuthEpoch(payload.sub, payload.ave);
      req.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        if (req.mediaAllowAnonymous) return true;
        throw err;
      }
      if (req.mediaAllowAnonymous) return true;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
