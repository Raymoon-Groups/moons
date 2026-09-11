import type { AuthResponse } from '@moons/shared';
import { cachedFetch } from './api-cache';
import {
  clearAuthSession,
  getAccessToken,
  hasSessionCookie,
  getStoredUser,
  setAuthSession,
} from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/** In-memory CSRF token — reliable when API is on a different subdomain than the web app. */
let csrfTokenMemory: string | null = null;

function readCsrfToken(): string | null {
  if (csrfTokenMemory) return csrfTokenMemory;
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )moons_csrf=([^;]*)/);
  const fromCookie = match ? decodeURIComponent(match[1]) : null;
  if (fromCookie) csrfTokenMemory = fromCookie;
  return fromCookie;
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCsrfToken();
  if (existing && existing.length >= 16) return existing;
  try {
    const response = await fetch(`${API_URL}/auth/csrf`, {
      credentials: 'include',
      headers: { 'X-Moons-Client': 'web' },
    });
    if (!response.ok) return readCsrfToken();
    const data = (await response.json()) as { csrfToken?: string };
    if (typeof data.csrfToken === 'string' && data.csrfToken.length >= 16) {
      csrfTokenMemory = data.csrfToken;
      return data.csrfToken;
    }
    return readCsrfToken();
  } catch {
    return readCsrfToken();
  }
}

export function clearCsrfTokenMemory() {
  csrfTokenMemory = null;
}

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
  | { ok: true; accessToken?: string }
  | { ok: false; reason: 'auth' | 'network' };

/** Single-flight refresh — concurrent 401s share one refresh call. */
let refreshInFlight: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<RefreshResult> => {
    try {
      // Prefer HttpOnly refresh cookie; empty body is enough for web.
      const data = await apiFetchRaw<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
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
  token?: string | null;
  skipAuthRetry?: boolean;
  cache?: boolean;
};

async function apiFetchRaw<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const method = (rest.method ?? 'GET').toUpperCase();
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const csrfToken = needsCsrf ? await ensureCsrfToken() : readCsrfToken();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        'X-Moons-Client': 'web',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
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
  request: (token: string | null) => Promise<T>,
): Promise<T> {
  const hasSession = hasSessionCookie() || !!getStoredUser() || !!getAccessToken();
  if (!hasSession) {
    throw new ApiError('Please log in to continue', 401);
  }

  let token = getAccessToken();

  try {
    return await request(token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const result = await refreshAccessToken();
      if (result.ok) {
        return request(getAccessToken());
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
  // Prefer cookie auth; Bearer is optional (in-memory) for media/dev convenience.
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

function uploadFormDataRaw<T>(
  path: string,
  formData: FormData,
  token: string | null,
  onProgress?: (progress: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    void (async () => {
      const csrfToken = await ensureCsrfToken();
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}${path}`);
      xhr.withCredentials = true;
      xhr.setRequestHeader('X-Moons-Client', 'web');
      if (csrfToken) xhr.setRequestHeader('X-CSRF-Token', csrfToken);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (!onProgress) return;
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          if (xhr.status === 204 || !xhr.responseText) {
            resolve(undefined as T);
            return;
          }
          try {
            resolve(JSON.parse(xhr.responseText) as T);
          } catch {
            reject(new ApiError('Invalid server response', xhr.status));
          }
          return;
        }

        let message = 'Request failed';
        let code: string | undefined;
        try {
          const body = JSON.parse(xhr.responseText) as unknown;
          const parsed = parseApiErrorBody(body);
          message = parsed.message;
          code = parsed.code;
        } catch {
          // ignore
        }
        reject(new ApiError(message, xhr.status, code));
      };

      xhr.onerror = () => {
        reject(new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR'));
      };

      xhr.send(formData);
    })().catch(reject);
  });
}

export async function authUploadWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress?: (progress: number) => void,
): Promise<T> {
  return withAuthRetry((token) => uploadFormDataRaw<T>(path, formData, token, onProgress));
}

export function authDelete<T>(path: string): Promise<T> {
  return withAuthRetry((token) =>
    apiFetch<T>(path, { method: 'DELETE', token }),
  );
}

/** Re-hydrate in-memory access token from the HttpOnly refresh cookie after a page reload. */
export async function ensureWebSession(): Promise<boolean> {
  if (!hasSessionCookie() && !getStoredUser()) return false;
  if (getAccessToken()) return true;
  const result = await refreshAccessToken();
  if (!result.ok && result.reason === 'auth') {
    clearAuthSession();
    return false;
  }
  return result.ok;
}
