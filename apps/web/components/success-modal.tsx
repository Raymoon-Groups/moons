'use client';

interface SuccessModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export function SuccessModal({ open, message, onClose }: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-sm rounded-lg bg-surface-elevated p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-bold text-moons-navy">Saved successfully!</h2>
        <p className="mt-2 text-sm text-foreground">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-moons-orange py-2.5 text-sm font-bold text-white hover:bg-moons-orange-dark"
        >
          OK
        </button>
      </div>
    </div>
  );
}
