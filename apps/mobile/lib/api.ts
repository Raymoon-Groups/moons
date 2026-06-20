import type { AuthResponse, AuthUser, UserRole } from '@moons/shared';
import { API_URL } from './api-url';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from './auth-storage';

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

async function parseError(response: Response): Promise<ApiError> {
  let message = 'Request failed';
  let code: string | undefined;
  try {
    const body = await response.json();
    message = body.message ?? message;
    if (Array.isArray(message)) message = message.join(', ');
    if (typeof body.code === 'string') code = body.code;
  } catch {
    // ignore
  }
  return new ApiError(message, response.status, code);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as AuthResponse;
    await setAuthSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
    return data.accessToken;
  } catch {
    return null;
  }
}

type FetchOptions = RequestInit & { token?: string; skipAuthRetry?: boolean };

async function apiFetchRaw<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  return apiFetchRaw<T>(path, options);
}

export async function authFetch<T>(
  path: string,
  options: Omit<FetchOptions, 'token'> = {},
): Promise<T> {
  let token = await getAccessToken();
  if (!token) {
    throw new ApiError('Please log in to continue', 401);
  }

  try {
    return await apiFetchRaw<T>(path, { ...options, token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !options.skipAuthRetry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetchRaw<T>(path, { ...options, token: newToken });
      }
    }
    throw err;
  }
}

export async function authUpload<T>(path: string, formData: FormData): Promise<T> {
  let token = await getAccessToken();
  if (!token) {
    throw new ApiError('Please log in to continue', 401);
  }

  try {
    return await apiFetchRaw<T>(path, { method: 'POST', body: formData, token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return await apiFetchRaw<T>(path, { method: 'POST', body: formData, token: newToken });
      }
    }
    throw err;
  }
}

export async function authDelete<T>(path: string): Promise<T> {
  let token = await getAccessToken();
  if (!token) {
    throw new ApiError('Please log in to continue', 401);
  }

  try {
    return await apiFetchRaw<T>(path, { method: 'DELETE', token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return await apiFetchRaw<T>(path, { method: 'DELETE', token: newToken });
      }
    }
    throw err;
  }
}

export async function persistAuthSession(data: AuthResponse) {
  await setAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  });
  return data;
}

export async function loginRequest(email: string, password: string) {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return persistAuthSession(data);
}

export async function googleAuthRequest(idToken: string, role: UserRole) {
  const data = await apiFetch<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, role }),
  });
  return persistAuthSession(data);
}

export async function sendRegisterOtp(email: string, password: string, role: UserRole) {
  return apiFetch<{ success: boolean; message: string }>('/auth/register/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
}

export async function resendRegisterOtp(email: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/register/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyRegisterOtp(email: string, otp: string) {
  const data = await apiFetch<AuthResponse>('/auth/register/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  return persistAuthSession(data);
}

export async function forgotPasswordRequest(email: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(
  email: string,
  otp: string,
  password: string,
  confirmPassword: string,
) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password, confirmPassword }),
  });
}

export async function completeOnboarding(formData: FormData) {
  return authUpload<{ user: AuthUser }>('/auth/onboarding/complete', formData);
}

export async function logoutRequest() {
  const refreshToken = await getRefreshToken();
  try {
    const token = await getAccessToken();
    await apiFetch('/auth/logout', {
      method: 'POST',
      token: token ?? undefined,
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // clear local session even if API fails
  }
  await clearAuthSession();
}
