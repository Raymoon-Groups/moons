'use client';

import { useEffect, useRef, useState } from 'react';
import { authDelete, authUpload } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import type { Profile } from '@/lib/types';

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function CoverPhotoBanner({
  bannerUrl,
  updatedAt,
  editable,
  onUpdated,
}: {
  bannerUrl: string | null;
  updatedAt?: string | null;
  editable: boolean;
  onUpdated?: (bannerUrl: string | null, updatedAt: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localBanner, setLocalBanner] = useState(bannerUrl);
  const [cacheVersion, setCacheVersion] = useState(updatedAt ?? '');

  useEffect(() => {
    setLocalBanner(bannerUrl);
    setCacheVersion(updatedAt ?? '');
  }, [bannerUrl, updatedAt]);

  const displayUrl = localBanner
    ? `${resolveAssetUrl(localBanner)}${cacheVersion ? `?v=${new Date(cacheVersion).getTime()}` : ''}`
    : null;

  async function handleFileSelect(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Cover photo must be 5 MB or smaller');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('banner', file);
      const result = await authUpload<Profile>('/profiles/me/banner', formData);
      setLocalBanner(result.bannerUrl ?? null);
      setCacheVersion(result.updatedAt);
      onUpdated?.(result.bannerUrl ?? null, result.updatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setUploading(true);
    setError('');
    try {
      const result = await authDelete<Profile>('/profiles/me/banner');
      setLocalBanner(null);
      setCacheVersion(result.updatedAt);
      onUpdated?.(null, result.updatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="group relative h-[140px] bg-[#d4dde3] dark:bg-surface sm:h-[180px] md:h-[200px]">
      {displayUrl ? (
        <>
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#c5d0d9] via-[#d8e0e6] to-[#b8c5cf] dark:from-surface dark:via-surface-elevated dark:to-surface-hover" />
      )}

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileSelect(file);
            }}
          />
          <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
            {displayUrl && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => void handleRemove()}
                className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border/60 transition hover:bg-surface disabled:opacity-60"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              title={displayUrl ? 'Change cover photo' : 'Add cover photo'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-foreground shadow-sm ring-1 ring-border/60 transition hover:bg-surface disabled:opacity-60 sm:h-9 sm:w-9"
            >
              <CameraIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-sm font-medium text-white">
              Uploading…
            </div>
          )}
        </>
      )}

      {error && (
        <p className="absolute bottom-2 left-3 right-3 truncate rounded bg-red-600/90 px-2 py-1 text-center text-[11px] text-white">
          {error}
        </p>
      )}
    </div>
  );
}
