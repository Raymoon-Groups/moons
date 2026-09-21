import type { CookieOptions, Request, Response } from 'express';
import { authCookieBaseOptions } from './auth-cookies';

export const ADMIN_PORTAL_COOKIE = 'moons_admin';
/** Readable flag for Next.js middleware (HttpOnly admin JWT stays on API cookie). */
export const ADMIN_PORTAL_FLAG_COOKIE = 'moons_admin_portal';

export const ADMIN_PORTAL_JWT_TYP = 'admin_portal';

export function adminPortalCookieOptions(): CookieOptions {
  const twelveHours = 12 * 60 * 60 * 1000;
  return {
    ...authCookieBaseOptions(),
    maxAge: twelveHours,
  };
}

export function adminPortalFlagCookieOptions(): CookieOptions {
  const twelveHours = 12 * 60 * 60 * 1000;
  return {
    ...authCookieBaseOptions(),
    httpOnly: false,
    maxAge: twelveHours,
  };
}

export function setAdminPortalCookies(res: Response, token: string) {
  res.cookie(ADMIN_PORTAL_COOKIE, token, adminPortalCookieOptions());
  res.cookie(ADMIN_PORTAL_FLAG_COOKIE, '1', adminPortalFlagCookieOptions());
}

export function clearAdminPortalCookies(res: Response) {
  const base = authCookieBaseOptions();
  const flagBase = adminPortalFlagCookieOptions();
  res.clearCookie(ADMIN_PORTAL_COOKIE, base);
  res.clearCookie(ADMIN_PORTAL_COOKIE, { ...base, domain: undefined });
  res.clearCookie(ADMIN_PORTAL_FLAG_COOKIE, flagBase);
  res.clearCookie(ADMIN_PORTAL_FLAG_COOKIE, { ...flagBase, domain: undefined });
}

export function extractAdminPortalTokenFromRequest(req: Request): string | null {
  const cookieToken = req.cookies?.[ADMIN_PORTAL_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
}

export function verifyAdminPortalPayload(payload: unknown): payload is { typ: string; sub: string } {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as Record<string, unknown>;
  return record.typ === ADMIN_PORTAL_JWT_TYP && typeof record.sub === 'string';
}

export function isAdminPortalConfigured(): boolean {
  const username = process.env.ADMIN_PORTAL_USERNAME?.trim();
  const plain = process.env.ADMIN_PORTAL_PASSWORD?.trim();
  const hash = process.env.ADMIN_PORTAL_PASSWORD_HASH?.trim();
  return Boolean(username && (plain || hash));
}
