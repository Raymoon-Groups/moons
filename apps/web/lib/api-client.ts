import type { AuthResponse } from '@moons/shared';
import { getAccessToken, setAuthSession } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const data = await apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' });
    setAuthSession(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; skipAuthRetry?: boolean } = {},
): Promise<T> {
  const { token, headers, skipAuthRetry, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.message ?? message;
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request(newToken);
      }
    }
    throw err;
  }
}

export function authFetch<T>(
  path: string,
  options: RequestInit = {},
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
