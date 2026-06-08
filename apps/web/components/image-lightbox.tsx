'use client';

interface ImageLightboxProps {
  open: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ open, src, alt = 'Profile photo', onClose }: ImageLightboxProps) {
  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative max-h-[90vh] max-w-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-sm font-medium text-white hover:underline"
        >
          Close ✕
        </button>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
