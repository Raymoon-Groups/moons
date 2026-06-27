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
    <div className="relative h-32 sm:h-40">
      {displayUrl ? (
        <img src={displayUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-r from-moons-blue/30 via-moons-blue/15 to-moons-navy/20" />
      )}

      {editable && (
        <div className="absolute inset-0 flex items-end justify-end gap-2 p-3 sm:items-center sm:justify-center sm:bg-black/0 sm:transition sm:hover:bg-black/35">
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
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-surface-elevated/95 px-3.5 py-1.5 text-xs font-semibold text-heading shadow-md ring-1 ring-border/40 backdrop-blur-sm transition hover:bg-white disabled:opacity-60 sm:bg-white/95 sm:text-sm sm:px-4 sm:py-2"
          >
            <CameraIcon className="h-4 w-4" />
            {uploading ? 'Uploading…' : displayUrl ? 'Change cover' : 'Add cover photo'}
          </button>
          {displayUrl && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => void handleRemove()}
              className="rounded-full bg-surface-elevated/95 px-3.5 py-1.5 text-xs font-semibold text-red-600 shadow-md ring-1 ring-border/40 backdrop-blur-sm transition hover:bg-white disabled:opacity-60 sm:bg-white/95 sm:text-sm sm:px-4 sm:py-2"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="absolute bottom-1 left-3 right-3 truncate rounded-lg bg-red-50/95 px-2 py-1 text-[10px] text-red-600 shadow sm:text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
