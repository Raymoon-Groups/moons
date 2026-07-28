import type { AuthResponse } from '@moons/shared';
import { cachedFetch } from './api-cache';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function parseApiErrorBody(body: unknown): { message: string; code?: string } {
  if (!body || typeof body !== 'object') {
    return { message: 'Request failed' };
  }

  const record = body as Record<string, unknown>;
  let message: unknown = record.message;
  let code = typeof record.code === 'string' ? record.code : undefined;

  if (message && typeof message === 'object' && !Array.isArray(message)) {
    const nested = message as Record<string, unknown>;
    if (typeof nested.message === 'string') message = nested.message;
    if (typeof nested.code === 'string') code = nested.code;
  }

  if (Array.isArray(message)) {
    message = message.join(', ');
  }

  const messageText =
    typeof message === 'string' && message.trim() ? message : 'Request failed';

  return { message: messageText, code };
}

export function getApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

type RefreshResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: 'auth' | 'network' };

/** Single-flight refresh — concurrent 401s share one refresh call. */
let refreshInFlight: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<RefreshResult> => {
    try {
      const bodyRefresh = getRefreshToken();
      const data = await apiFetchRaw<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(bodyRefresh ? { refreshToken: bodyRefresh } : {}),
      });
      setAuthSession(data);
      return { ok: true, accessToken: data.accessToken };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return { ok: false, reason: 'auth' };
      }
      return { ok: false, reason: 'network' };
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

type ApiFetchOptions = Omit<RequestInit, 'cache'> & {
  token?: string;
  skipAuthRetry?: boolean;
  cache?: boolean;
};

async function apiFetchRaw<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    let message = 'Request failed';
    let code: string | undefined;
    try {
      const body = await response.json();
      const parsed = parseApiErrorBody(body);
      message = parsed.message;
      code = parsed.code;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { cache = true, token, ...rest } = options;
  const method = (rest.method ?? 'GET').toUpperCase();
  const isPublicGet = method === 'GET' && !token;

  if (isPublicGet && cache) {
    return cachedFetch(`GET:${path}`, () => apiFetchRaw<T>(path, { ...rest, token }));
  }

  return apiFetchRaw<T>(path, { ...rest, token });
}

async function withAuthRetry<T>(
  request: (token: string) => Promise<T>,
): Promise<T> {
  let token = getAccessToken();
  if (!token) {
    throw new ApiError('Please log in to continue', 401);
  }

  try {
    return await request(token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const result = await refreshAccessToken();
      if (result.ok) {
        return request(result.accessToken);
      }
      if (result.reason === 'auth') {
        clearAuthSession();
        throw new ApiError(
          'Your session has expired. Please sign in again.',
          401,
          'SESSION_EXPIRED',
        );
      }
      throw new ApiError(
        'Could not refresh your session. Check your connection and try again.',
        503,
        'REFRESH_NETWORK_ERROR',
      );
    }
    throw err;
  }
}

export function authFetch<T>(
  path: string,
  options: Omit<ApiFetchOptions, 'token'> = {},
): Promise<T> {
  return withAuthRetry((token) => apiFetch<T>(path, { ...options, token }));
}

export async function authUpload<T>(path: string, formData: FormData): Promise<T> {
  return withAuthRetry((token) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: formData,
      token,
    }),
  );
}

export function authDelete<T>(path: string): Promise<T> {
  return withAuthRetry((token) =>
    apiFetch<T>(path, { method: 'DELETE', token }),
  );
}
