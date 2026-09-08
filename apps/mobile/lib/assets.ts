import { API_ORIGIN } from './api-url';

/**
 * Keeps the access token available for media URLs (Image/Video cannot always set headers).
 */
let assetAccessToken: string | null = null;

export function setAssetAuthToken(token: string | null | undefined) {
  assetAccessToken = token?.trim() ? token.trim() : null;
}

export function getAssetAuthToken() {
  return assetAccessToken;
}

/** Map legacy `/uploads/...` paths to authenticated `/api/v1/media/...`. */
export function toProtectedMediaPath(url: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `/api/v1/media/${parsed.pathname.slice('/uploads/'.length)}`;
      }
      return url;
    }
  } catch {
    // fall through
  }

  if (url.startsWith('/uploads/')) {
    return `/api/v1/media/${url.slice('/uploads/'.length)}`;
  }
  if (url.startsWith('uploads/')) {
    return `/api/v1/media/${url.slice('uploads/'.length)}`;
  }
  return url.startsWith('/') ? url : `/${url}`;
}

function withAccessToken(absoluteUrl: string): string {
  if (!assetAccessToken) return absoluteUrl;
  if (absoluteUrl.includes('access_token=')) return absoluteUrl;
  const sep = absoluteUrl.includes('?') ? '&' : '?';
  return `${absoluteUrl}${sep}access_token=${encodeURIComponent(assetAccessToken)}`;
}

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const mapped = toProtectedMediaPath(url);
    if (mapped.startsWith('http://') || mapped.startsWith('https://')) {
      if (mapped.includes('/api/v1/media/')) {
        return withAccessToken(mapped);
      }
      return mapped;
    }
    return withAccessToken(`${API_ORIGIN}${mapped}`);
  }

  const path = toProtectedMediaPath(url);
  const absolute = `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  if (path.includes('/api/v1/media/')) {
    return withAccessToken(absolute);
  }
  return absolute;
}

export function resolveAvatarUrl(
  url: string | null | undefined,
  version?: number,
): string | null {
  const base = resolveAssetUrl(url);
  if (!base) return null;
  if (!version) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}v=${version}`;
}
