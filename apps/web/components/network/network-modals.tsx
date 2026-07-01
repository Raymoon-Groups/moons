'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveAvatarUrl } from '@/lib/assets';
import { fetchConnectionStatus, sendConnectionRequest } from '@/lib/network';
import { fetchConversationWithUser, notifyMessagesRefresh, sendMessageToUser } from '@/lib/messages';
import { MessageComposeField } from '@/components/messages/message-compose-field';

const NOTE_MAX = 300;

export function ConnectInviteModal({
  open,
  userId,
  fullName,
  headline,
  avatarUrl,
  onClose,
  onSent,
}: {
  open: boolean;
  userId: string;
  fullName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  onClose: () => void;
  onSent: (connectionId: string) => void;
}) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const avatar = resolveAvatarUrl(avatarUrl ?? null);
  const initial = fullName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    setNote('');
    setError('');
    setConnectionStatus(null);
    setCheckingStatus(true);
    fetchConnectionStatus(userId)
      .then((result) => setConnectionStatus(result.status))
      .catch(() => setConnectionStatus(null))
      .finally(() => setCheckingStatus(false));
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const alreadyConnected = connectionStatus === 'ACCEPTED';
  const alreadyPending = connectionStatus === 'PENDING';
  const blocked = alreadyConnected || alreadyPending;

  async function handleSend() {
    if (blocked) return;
    setLoading(true);
    setError('');
    try {
      const result = await sendConnectionRequest(userId, note.trim() || undefined);
      const id = result && typeof result === 'object' && 'id' in result ? String((result as { id: string }).id) : '';
      onSent(id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invitation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-surface-elevated shadow-2xl ring-1 ring-border/60">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-heading">Add a note to your invitation</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-moons-muted hover:bg-surface hover:text-heading" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex gap-3 border-b border-border/50 px-5 py-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-lg font-semibold text-moons-navy ring-1 ring-border/50">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
          </div>
          <div className="min-w-0 pt-1">
            <p className="truncate font-semibold text-heading">{fullName}</p>
            {headline && <p className="mt-0.5 line-clamp-2 text-sm text-moons-muted">{headline}</p>}
          </div>
        </div>

        <div className="px-5 py-4">
          {checkingStatus ? (
            <p className="text-sm text-moons-muted">Checking connection status…</p>
          ) : alreadyConnected ? (
            <p className="text-sm text-foreground">
              You&apos;re already connected with {fullName.split(' ')[0]}. Use Message on their profile
              to chat.
            </p>
          ) : alreadyPending ? (
            <p className="text-sm text-foreground">
              A connection invitation is already pending with {fullName.split(' ')[0]}.
            </p>
          ) : (
            <>
              <label htmlFor="connect-note" className="sr-only">
                Personalize your invitation
              </label>
              <textarea
                id="connect-note"
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                rows={4}
                placeholder={`Hi ${fullName.split(' ')[0]}, I'd like to connect with you on MoonsJob.`}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:ring-1 focus:ring-moons-blue/30"
              />
              <p className="mt-1 text-right text-[11px] text-moons-muted">
                {note.length}/{NOTE_MAX}
              </p>
            </>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-surface/40 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-moons-muted hover:bg-surface hover:text-heading"
          >
            {blocked ? 'Close' : 'Cancel'}
          </button>
          {!blocked && (
            <button
              type="button"
              disabled={loading || checkingStatus}
              onClick={() => void handleSend()}
              className="rounded-full bg-moons-navy px-5 py-2 text-sm font-semibold text-white hover:bg-moons-blue-dark disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send invitation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageComposeModal({
  open,
  userId,
  fullName,
  headline,
  avatarUrl,
  onClose,
  onSent,
}: {
  open: boolean;
  userId: string;
  fullName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  onClose: () => void;
  onSent?: (conversationId: string) => void;
}) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const avatar = resolveAvatarUrl(avatarUrl ?? null);
  const initial = fullName.charAt(0).toUpperCase();
  const firstName = fullName.split(' ')[0];

  useEffect(() => {
    if (!open) return;
    setText('');
    setAttachment(null);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    setLoading(true);
    setError('');
    try {
      await sendMessageToUser(userId, trimmed, attachment ?? undefined);
      const conversation = await fetchConversationWithUser(userId);
      notifyMessagesRefresh();
      onSent?.(conversation.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-surface-elevated shadow-2xl ring-1 ring-border/60">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-moons-navy">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heading">New message</p>
            <p className="truncate text-xs text-moons-muted">To: {fullName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-moons-muted hover:bg-surface" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          <MessageComposeField
            value={text}
            onChange={setText}
            attachment={attachment}
            onAttachmentChange={setAttachment}
            onSubmit={() => void handleSend()}
            sending={loading}
            placeholder={`Write a message to ${firstName}…`}
            rows={5}
            compact
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-moons-muted hover:bg-surface">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShareProfileMenu({
  userId,
  fullName,
  headline,
  className,
}: {
  userId: string;
  fullName: string;
  headline?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/network/${userId}`
      : `/network/${userId}`;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = profileUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} on MoonsJob`,
          text: headline ?? `View ${fullName}'s professional profile`,
          url: profileUrl,
        });
        setOpen(false);
      } catch {
        // user cancelled
      }
    } else {
      void copyLink();
    }
  }

  return (
    <div ref={menuRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center justify-center rounded-full border border-border bg-surface-elevated px-4 text-[13px] font-semibold text-heading transition hover:bg-surface"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Share
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-border bg-surface-elevated py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void copyLink()}
            className="flex w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface"
          >
            {copied ? 'Link copied!' : 'Copy link to profile'}
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void nativeShare()}
              className="flex w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface"
            >
              Share via…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function formatRecommendationReason(reason?: string | null): string | null {
  if (!reason) return null;
  return reason
    .replace(/^Recommended because /i, '')
    .replace(/^Recommended based on /i, 'Based on ')
    .trim();
}
