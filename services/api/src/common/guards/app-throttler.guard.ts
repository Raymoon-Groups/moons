import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Global rate-limit guard. Tracks by IP (and forwarded IP behind a proxy).
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return String(forwarded[0]).split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ method?: string; url?: string }>();
    const url = req.url ?? '';
    // Health checks should never be rate-limited.
    if (url.startsWith('/api/v1/health') || url.startsWith('/api/docs')) {
      return true;
    }
    // Media streams are high-frequency (images/videos); ACL is enforced separately.
    if (url.startsWith('/api/v1/media/')) {
      return true;
    }
    return super.shouldSkip(context);
  }
}
