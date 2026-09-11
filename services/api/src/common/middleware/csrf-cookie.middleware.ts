import { randomBytes } from 'crypto';
import type { CookieOptions, Request, Response } from 'express';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieBaseOptions,
} from '../../auth/auth-cookies';

export const CSRF_COOKIE = 'moons_csrf';
export const CSRF_HEADER = 'x-csrf-token';

function clientKind(req: Request): string {
  const raw = req.headers['x-moons-client'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value ?? '').trim().toLowerCase();
}

function csrfCookieOptions(): CookieOptions {
  const domain = process.env.COOKIE_DOMAIN?.trim() || undefined;
  return {
    ...authCookieBaseOptions(),
    // Readable by the SPA so it can echo the value in X-CSRF-Token (double-submit).
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(domain ? { domain } : {}),
  };
}

export function ensureCsrfCookie(req: Request, res: Response) {
  const existing = req.cookies?.[CSRF_COOKIE];
  if (typeof existing === 'string' && existing.length >= 16) {
    return existing;
  }
  const token = randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  // Make it visible to later middleware in this same request.
  if (req.cookies) {
    req.cookies[CSRF_COOKIE] = token;
  }
  return token;
}

/**
 * Mitigates CSRF when auth is cookie-based (esp. SameSite=None in production).
 * Bearer / mobile clients skip this check.
 *
 * Defenses combined:
 * 1) Allowed Origin
 * 2) Double-submit CSRF cookie + X-CSRF-Token header
 */
export function csrfCookieProtection(
  req: Request,
  res: Response,
  next: (err?: unknown) => void,
) {
  const method = req.method.toUpperCase();
  const isSafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const isMobileClient = clientKind(req) === 'mobile';

  // Keep a CSRF cookie available for browser sessions only.
  if (
    !isMobileClient &&
    (!isSafe || req.headers.origin || req.cookies?.[ACCESS_COOKIE] || req.cookies?.[REFRESH_COOKIE])
  ) {
    ensureCsrfCookie(req, res);
  }

  if (isSafe) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  // Native / Expo apps use Bearer tokens in JSON — never cookie CSRF.
  if (isMobileClient) {
    next();
    return;
  }

  const hasAuthCookie =
    Boolean(req.cookies?.[ACCESS_COOKIE]) || Boolean(req.cookies?.[REFRESH_COOKIE]);
  if (!hasAuthCookie) {
    next();
    return;
  }

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (!origin || !isAllowedOrigin(origin)) {
    res.status(403).json({
      statusCode: 403,
      message: 'CSRF validation failed',
      code: 'CSRF_REJECTED',
    });
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerTokenRaw = req.headers[CSRF_HEADER];
  const headerToken = Array.isArray(headerTokenRaw) ? headerTokenRaw[0] : headerTokenRaw;

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    cookieToken.length < 16 ||
    headerToken !== cookieToken
  ) {
    res.status(403).json({
      statusCode: 403,
      message: 'CSRF token missing or invalid',
      code: 'CSRF_TOKEN_INVALID',
    });
    return;
  }

  next();
}

function isAllowedOrigin(origin: string): boolean {
  const configured = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const allowed = new Set([
    ...configured,
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  if (allowed.has(origin)) return true;

  if (process.env.NODE_ENV === 'production') return false;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}
