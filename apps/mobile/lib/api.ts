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

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let message = 'Request failed';
  let code: string | undefined;
  try {
    const body = await response.json();
    let rawMessage: unknown = body.message;
    if (typeof body.code === 'string') code = body.code;

    if (rawMessage && typeof rawMessage === 'object' && !Array.isArray(rawMessage)) {
      const nested = rawMessage as Record<string, unknown>;
      if (typeof nested.message === 'string') rawMessage = nested.message;
      if (typeof nested.code === 'string') code = nested.code;
    }

    if (Array.isArray(rawMessage)) rawMessage = rawMessage.join(', ');
    if (typeof rawMessage === 'string' && rawMessage.trim()) message = rawMessage;
  } catch {
    // ignore
  }
  return new ApiError(message, response.status, code);
}

type RefreshResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: 'auth' | 'network' };

/** Single-flight refresh — concurrent 401s share one refresh call. */
let refreshInFlight: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<RefreshResult> => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return { ok: false, reason: 'auth' };
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { ok: false, reason: 'auth' };
        }
        return { ok: false, reason: 'network' };
      }
      const data = (await response.json()) as AuthResponse;
      await setAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      return { ok: true, accessToken: data.accessToken };
    } catch {
      return { ok: false, reason: 'network' };
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function withAuthRetry<T>(
  request: (token: string) => Promise<T>,
): Promise<T> {
  const token = await getAccessToken();
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
        await clearAuthSession();
        throw new ApiError(
          'Your session has expired. Please sign in again.',
          401,
          'SESSION_EXPIRED',
        );
      }
      throw new NetworkError(
        'Could not refresh your session. Check your connection and try again.',
      );
    }
    throw err;
  }
}

type FetchOptions = RequestInit & { token?: string; skipAuthRetry?: boolean };

async function apiFetchRaw<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new NetworkError(
      `Cannot reach the server (${API_URL}). Make sure the API is running (pnpm api) and your phone is on the same Wi‑Fi as this computer.`,
    );
  }

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
  if (options.skipAuthRetry) {
    const token = await getAccessToken();
    if (!token) throw new ApiError('Please log in to continue', 401);
    return apiFetchRaw<T>(path, { ...options, token });
  }
  return withAuthRetry((token) => apiFetchRaw<T>(path, { ...options, token }));
}

async function parseXhrError(xhr: XMLHttpRequest): Promise<ApiError> {
  let message = 'Request failed';
  let code: string | undefined;
  try {
    if (xhr.responseText) {
      const body = JSON.parse(xhr.responseText);
      let rawMessage: unknown = body.message;
      if (typeof body.code === 'string') code = body.code;

      if (rawMessage && typeof rawMessage === 'object' && !Array.isArray(rawMessage)) {
        const nested = rawMessage as Record<string, unknown>;
        if (typeof nested.message === 'string') rawMessage = nested.message;
        if (typeof nested.code === 'string') code = nested.code;
      }

      if (Array.isArray(rawMessage)) rawMessage = rawMessage.join(', ');
      if (typeof rawMessage === 'string' && rawMessage.trim()) message = rawMessage;
    }
  } catch {
    // ignore
  }
  if (message === 'Request failed' && xhr.status > 0) {
    if (xhr.status === 413) {
      message = 'File is too large to upload. Try a smaller photo or video.';
    } else if (xhr.status >= 500) {
      message = 'Server error while uploading. Please try again in a moment.';
    } else {
      message = `Upload failed (${xhr.status})`;
    }
  }
  return new ApiError(message, xhr.status, code);
}

function uploadFormDataRaw<T>(
  path: string,
  formData: FormData,
  token: string,
  onProgress?: (progress: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

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
      if (xhr.status === 401) {
        reject(new ApiError('Unauthorized', 401));
        return;
      }
      void parseXhrError(xhr).then(reject);
    };

    xhr.onerror = () => {
      reject(
        new NetworkError(
          `Cannot reach the server (${API_URL}). Make sure the API is running (pnpm api) and your phone is on the same Wi‑Fi as this computer.`,
        ),
      );
    };

    xhr.send(formData);
  });
}

export async function authUploadWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress?: (progress: number) => void,
): Promise<T> {
  return withAuthRetry((token) => uploadFormDataRaw<T>(path, formData, token, onProgress));
}

export async function authUpload<T>(path: string, formData: FormData): Promise<T> {
  return withAuthRetry((token) => uploadFormDataRaw<T>(path, formData, token));
}

export async function authDelete<T>(path: string): Promise<T> {
  return withAuthRetry((token) => apiFetchRaw<T>(path, { method: 'DELETE', token }));
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

