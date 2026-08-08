'use client';

import { useRef, useState } from 'react';
import {
  MAX_MESSAGE_ATTACHMENT_LABEL,
  MESSAGE_ATTACHMENT_ACCEPT,
  isMessageAttachmentTooLarge,
  messageAttachmentTooLargeMessage,
} from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';

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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
    </svg>
  );
}

async function downloadAttachment(url: string, fileName: string) {
  const href = resolveAssetUrl(url) ?? url;
  try {
    const response = await fetch(href);
    if (!response.ok) throw new Error('download failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName || 'attachment';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(href, '_blank', 'noopener,noreferrer');
  }
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
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    await downloadAttachment(url, fileName);
    setBusy(false);
  }

  if (isImage) {
    return (
      <div className="mt-2 space-y-2">
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={href}
            alt={fileName}
            className="max-h-48 max-w-full rounded-lg border border-white/20 object-cover"
          />
        </a>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-60 ${
            isMine
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-moons-blue/10 text-moons-blue hover:bg-moons-blue/15'
          }`}
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          {busy ? 'Downloading…' : 'Download'}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
        isMine
          ? 'border-white/30 bg-white/10 text-white'
          : 'border-border bg-surface-elevated text-heading'
      }`}
    >
      <AttachIcon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{fileName}</span>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={busy}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${
          isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-moons-blue text-white hover:bg-moons-blue-dark'
        }`}
      >
        <DownloadIcon className="h-3.5 w-3.5" />
        {busy ? '…' : 'Download'}
      </button>
    </div>
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
    if (isMessageAttachmentTooLarge(file.size)) {
      window.alert(messageAttachmentTooLargeMessage());
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
          title={`Attach file (max ${MAX_MESSAGE_ATTACHMENT_LABEL})`}
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
          aria-label="Send message"
          className={`shrink-0 rounded-full bg-moons-blue font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark disabled:opacity-40 ${
            compact ? 'h-10 px-3 text-sm sm:px-4' : 'h-10 px-3 text-sm sm:px-5'
          }`}
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
      {!compact && (
        <p className="px-2 pb-0.5 pt-1 text-[10px] text-moons-muted">
          Enter to send · Shift+Enter for new line · Up to {MAX_MESSAGE_ATTACHMENT_LABEL}
        </p>
      )}
    </div>
  );
}
