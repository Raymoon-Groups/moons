import type { CookieOptions, Request, Response } from 'express';

export const ACCESS_COOKIE = 'moons_access';
export const REFRESH_COOKIE = 'moons_refresh';

function isProd() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Shared cookie flags.
 * www.moonsjob.com ↔ api.moonsjob.com are same-site (eTLD+1), so Lax is correct and
 * more reliable than None (which some browsers restrict as third-party).
 */
export function authCookieBaseOptions(): CookieOptions {
  const prod = isProd();
  const domain = process.env.COOKIE_DOMAIN?.trim() || undefined;
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'lax' : 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
  };
}

export function refreshCookieOptions(): CookieOptions {
  return {
    ...authCookieBaseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

/** Matches default JWT access lifetime (60m). */
export function accessCookieOptions(): CookieOptions {
  const raw = process.env.JWT_ACCESS_EXPIRES_IN ?? '60m';
  const maxAge = parseDurationToMs(raw) ?? 60 * 60 * 1000;
  return {
    ...authCookieBaseOptions(),
    maxAge,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
}

function clearCookieBothDomains(
  res: Response,
  name: string,
  base: CookieOptions,
) {
  res.clearCookie(name, base);
  // Also clear host-only copies left over from before COOKIE_DOMAIN was set.
  const { domain: _domain, ...withoutDomain } = base;
  res.clearCookie(name, withoutDomain);
}

export function clearAuthCookies(res: Response) {
  clearCookieBothDomains(res, ACCESS_COOKIE, authCookieBaseOptions());
  clearCookieBothDomains(res, REFRESH_COOKIE, authCookieBaseOptions());
  clearCookieBothDomains(res, 'moons_csrf', {
    ...authCookieBaseOptions(),
    httpOnly: false,
  });
}

export function extractAccessTokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer) return bearer;
  }

  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }

  const query = req.query?.access_token;
  if (typeof query === 'string' && query.length > 0) {
    return query;
  }

  return null;
}

function parseDurationToMs(value: string): number | null {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return amount * mult;
}
