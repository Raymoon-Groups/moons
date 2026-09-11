'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedImageFile, maxEdgeForCropKind } from '@/lib/crop-image';

export type ImageCropAspect = 'avatar' | 'cover' | 'logo';

const ASPECT_BY_KIND: Record<ImageCropAspect, number> = {
  avatar: 1,
  logo: 1,
  cover: 16 / 5,
};

const TITLE_BY_KIND: Record<ImageCropAspect, string> = {
  avatar: 'Adjust profile photo',
  logo: 'Adjust company logo',
  cover: 'Adjust cover photo',
};

export function ImageCropModal({
  open,
  imageSrc,
  fileName,
  aspect = 'avatar',
  onCancel,
  onComplete,
}: {
  open: boolean;
  imageSrc: string | null;
  fileName: string;
  /** @deprecated mime is always normalized to JPEG on export */
  mimeType?: string;
  aspect?: ImageCropAspect;
  onCancel: () => void;
  onComplete: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError('');
    setBusy(false);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  if (!mounted || !open || !imageSrc) return null;

  const src = imageSrc;

  async function handleApply() {
    if (!croppedAreaPixels) {
      setError('Adjust the photo, then try Apply again');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const file = await getCroppedImageFile(
        src,
        croppedAreaPixels,
        fileName,
        maxEdgeForCropKind(aspect),
      );
      onComplete(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop image');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    setError('');
    onCancel();
  }

  const cropShape = aspect === 'avatar' ? 'round' : 'rect';
  const frameStyle =
    aspect === 'cover'
      ? { height: 240 }
      : { height: 360, width: 360, maxWidth: '100%' as const, marginLeft: 'auto', marginRight: 'auto' };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={handleCancel}
        aria-label="Close crop"
        disabled={busy}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={TITLE_BY_KIND[aspect]}
        className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-surface-elevated p-5 shadow-2xl sm:p-6"
      >
        <h2 className="text-lg font-bold text-heading">{TITLE_BY_KIND[aspect]}</h2>
        <p className="mt-1 text-sm text-moons-muted">Drag to reposition · use the slider to zoom</p>

        <div className="relative mt-4 overflow-hidden rounded-xl bg-black" style={frameStyle}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT_BY_KIND[aspect]}
            cropShape={cropShape}
            showGrid={aspect === 'cover'}
            objectFit={aspect === 'cover' ? 'horizontal-cover' : 'cover'}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="mt-4 flex items-center gap-3">
          <span className="shrink-0 text-xs font-medium text-moons-muted">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-moons-blue"
            disabled={busy}
          />
        </label>

        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={busy}
            className="rounded-lg bg-moons-blue px-4 py-2 text-sm font-semibold text-white hover:bg-moons-blue-dark disabled:opacity-60"
          >
            {busy ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
