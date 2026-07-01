'use client';

import { useRef } from 'react';
import { resolveAssetUrl } from '@/lib/assets';

export const MESSAGE_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.txt,image/jpeg,image/png,image/gif,image/webp';

function AttachIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
      />
    </svg>
  );
}

export function MessageAttachmentContent({
  url,
  fileName,
  mimeType,
  isMine,
}: {
  url: string;
  fileName: string;
  mimeType?: string | null;
  isMine?: boolean;
}) {
  const href = resolveAssetUrl(url) ?? url;
  const isImage = mimeType?.startsWith('image/');

  if (isImage) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 block">
        <img
          src={href}
          alt={fileName}
          className="max-h-48 max-w-full rounded-lg border border-white/20 object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        isMine
          ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
          : 'border-border bg-surface-elevated text-heading hover:bg-surface'
      }`}
    >
      <AttachIcon className="h-4 w-4 shrink-0" />
      <span className="truncate">{fileName}</span>
    </a>
  );
}

export function MessageComposeField({
  value,
  onChange,
  attachment,
  onAttachmentChange,
  onSubmit,
  sending,
  placeholder,
  rows = 2,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  attachment: File | null;
  onAttachmentChange: (file: File | null) => void;
  onSubmit: () => void;
  sending?: boolean;
  placeholder?: string;
  rows?: number;
  compact?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = Boolean(value.trim() || attachment);

  function handleFileSelect(file: File | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      window.alert('File must be 10 MB or smaller.');
      return;
    }
    onAttachmentChange(file);
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-2 shadow-sm">
      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-moons-blue/20 bg-moons-blue/5 px-3 py-2">
          <AttachIcon className="h-4 w-4 shrink-0 text-moons-blue" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-heading">
            {attachment.name}
          </span>
          <button
            type="button"
            onClick={() => onAttachmentChange(null)}
            className="text-xs font-semibold text-moons-muted hover:text-red-600"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={MESSAGE_ATTACHMENT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Attach file"
          title="Attach file"
          className={`flex shrink-0 items-center justify-center rounded-full border border-border/80 bg-surface-elevated text-moons-muted transition hover:border-moons-blue/40 hover:text-moons-blue disabled:opacity-50 ${
            compact ? 'h-10 w-10' : 'h-10 w-10'
          }`}
        >
          <AttachIcon className="h-4 w-4" />
        </button>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={`flex-1 resize-none rounded-xl border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-moons-muted focus:ring-0 ${
            compact ? 'min-h-[40px]' : 'min-h-[44px]'
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend && !sending) onSubmit();
            }
          }}
        />
        <button
          type="button"
          disabled={sending || !canSend}
          onClick={onSubmit}
          className={`shrink-0 rounded-full bg-moons-blue font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark disabled:opacity-40 ${
            compact ? 'h-10 px-4 text-sm' : 'h-10 px-5 text-sm'
          }`}
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
      {!compact && (
        <p className="px-2 pb-0.5 pt-1 text-[10px] text-moons-muted">
          Enter to send · Shift+Enter for new line · Up to 10 MB
        </p>
      )}
    </div>
  );
}
