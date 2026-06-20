import { API_ORIGIN } from './api-url';

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
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
