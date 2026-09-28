import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Global rate-limit guard.
 * Prefer authenticated user id so many phones behind one carrier/NAT IP
 * (or a misconfigured proxy) do not share a single bucket.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId =
      req.user?.sub ||
      req.user?.id ||
      (typeof req.headers?.authorization === 'string'
        ? this.userIdFromBearer(req.headers.authorization)
        : null);
    if (userId) return `user:${userId}`;

    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return `ip:${forwarded.split(',')[0].trim()}`;
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return `ip:${String(forwarded[0]).split(',')[0].trim()}`;
    }
    return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  }

  /** Cheap decode of JWT payload (no verify) — only used as a rate-limit key. */
  private userIdFromBearer(authorization: string): string | null {
    try {
      const token = authorization.replace(/^Bearer\s+/i, '').trim();
      const payload = token.split('.')[1];
      if (!payload) return null;
      const json = Buffer.from(payload, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as { sub?: string };
      return parsed.sub ? String(parsed.sub) : null;
    } catch {
      return null;
    }
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ method?: string; url?: string }>();
    const url = req.url ?? '';
    if (url.startsWith('/api/v1/health') || url.startsWith('/api/docs')) {
      return true;
    }
    if (url.startsWith('/api/v1/media/')) {
      return true;
    }
    return super.shouldSkip(context);
  }
}
