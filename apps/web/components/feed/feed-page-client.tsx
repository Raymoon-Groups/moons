'use client';

import Link from 'next/link';
import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { FeedPost, PostAuthor, PostCommentItem } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  fetchComments,
  fetchFeed,
  fetchLikes,
  likePost,
  unlikePost,
  updatePost,
} from '@/lib/posts';
import { fetchConnections, sendConnectionRequest, type ConnectionListItem } from '@/lib/network';
import { notifyMessagesRefresh, sendMessageToUser } from '@/lib/messages';
import { useAuth } from '@/lib/auth-context';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function displayName(person: Pick<PostAuthor, 'fullName'> | null | undefined, fallback = 'Someone') {
  return person?.fullName?.trim() || fallback;
}

function Avatar({
  url,
  name,
  className = 'h-11 w-11',
}: {
  url: string | null;
  name: string | null;
  className?: string;
}) {
  const src = resolveAssetUrl(url);
  const initial = (name?.trim()?.[0] || '?').toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${className} rounded-full object-cover`} />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-moons-blue/15 text-sm font-bold text-moons-blue ${className}`}
    >
      {initial}
    </div>
  );
}

function Icon({
  children,
  className = 'h-4 w-4',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function LikeIcon({ filled = false, className }: { filled?: boolean; className?: string }) {
  return (
    <Icon className={className}>
      <path
        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
        fill={filled ? 'currentColor' : 'none'}
      />
    </Icon>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </Icon>
  );
}

function ForwardIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M15 17l5-5-5-5" />
      <path d="M4 18v-2a4 4 0 014-4h12" />
    </Icon>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </Icon>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Icon>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </Icon>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
      <path d="M10 11v6M14 11v6" />
    </Icon>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Icon>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M10 13a5 5 0 007.54.54l1.92-1.92a5 5 0 00-7.07-7.07L10.8 6.1" />
      <path d="M14 11a5 5 0 00-7.54-.54L4.54 12.4a5 5 0 007.07 7.07L13.2 17.9" />
    </Icon>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </Icon>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </Icon>
  );
}

function RepostIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </Icon>
  );
}

function EmptyFeedIcon({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'mx-auto h-10 w-10 text-moons-muted'}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </Icon>
  );
}

function LikersModal({
  open,
  loading,
  likers,
  likeCount,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  likers: PostAuthor[];
  likeCount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="likers-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(28rem,calc(100dvh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[0_24px_60px_-12px_rgba(26,39,68,0.35)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <h2 id="likers-modal-title" className="text-base font-bold text-heading">
            Likes ({likeCount})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-moons-muted hover:bg-surface hover:text-heading"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-2 py-2 sm:px-3">
          {loading && likers.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-moons-muted">Loading…</p>
          ) : likers.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-moons-muted">No likes yet</p>
          ) : (
            <ul className="space-y-1">
              {likers.map((person) => (
                <li key={person.userId}>
                  <Link
                    href={`/network/${person.userId}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface"
                  >
                    <Avatar url={person.avatarUrl} name={person.fullName} className="h-10 w-10" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-heading">
                        {displayName(person, 'Member')}
                      </span>
                      {person.headline ? (
                        <span className="block truncate text-xs text-moons-muted">
                          {person.headline}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ForwardPostModal({
  open,
  post,
  onClose,
}: {
  open: boolean;
  post: FeedPost;
  onClose: () => void;
}) {
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setNote('');
    setError('');
    setSentCount(0);
    setLoading(true);
    void fetchConnections(1)
      .then((data) => setConnections(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load connections'))
      .finally(() => setLoading(false));

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleForward() {
    if (selected.size === 0) return;
    setSending(true);
    setError('');
    const link =
      typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard?post=${post.id}`
        : `/dashboard?post=${post.id}`;
    const author = post.author.fullName?.trim() || 'a MoonsJob member';
    const preview = post.body.trim()
      ? post.body.trim().slice(0, 120)
      : post.media.length
        ? 'Shared a photo/video'
        : 'Shared a post';
    const message = [
      note.trim() || `Forwarded a post from ${author}`,
      preview,
      link,
    ]
      .filter(Boolean)
      .join('\n\n');

    let ok = 0;
    const failures: string[] = [];
    for (const userId of selected) {
      try {
        await sendMessageToUser(userId, message);
        ok += 1;
      } catch {
        const name =
          connections.find((c) => c.user.userId === userId)?.user.fullName?.trim() || 'Someone';
        failures.push(name);
      }
    }

    notifyMessagesRefresh();
    setSentCount(ok);
    setSending(false);

    if (failures.length) {
      setError(`Sent to ${ok}. Failed for: ${failures.join(', ')}`);
      return;
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forward-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(34rem,calc(100dvh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[0_24px_60px_-12px_rgba(26,39,68,0.35)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <h2 id="forward-modal-title" className="text-base font-bold text-heading">
            Forward post
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-moons-muted hover:bg-surface hover:text-heading"
          >
            Close
          </button>
        </div>

        <div className="border-b border-border px-4 py-3 sm:px-5">
          <label className="block text-xs font-semibold text-moons-muted" htmlFor="forward-note">
            Add a note (optional)
          </label>
          <textarea
            id="forward-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Say something about this post…"
            className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading outline-none focus:ring-2 focus:ring-moons-blue/30"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {loading ? (
            <p className="px-3 py-8 text-center text-sm text-moons-muted">Loading connections…</p>
          ) : connections.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-moons-muted">
              No connections yet. Connect with people to forward posts.
            </p>
          ) : (
            <ul className="space-y-1">
              {connections.map((item) => {
                const checked = selected.has(item.user.userId);
                return (
                  <li key={item.connectionId}>
                    <button
                      type="button"
                      onClick={() => toggle(item.user.userId)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface ${
                        checked ? 'bg-moons-blue/10' : ''
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? 'border-moons-blue bg-moons-blue text-white'
                            : 'border-border bg-surface-elevated'
                        }`}
                        aria-hidden
                      >
                        {checked ? '✓' : null}
                      </span>
                      <Avatar
                        url={item.user.avatarUrl}
                        name={item.user.fullName}
                        className="h-10 w-10"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-heading">
                          {item.user.fullName?.trim() || 'Member'}
                        </span>
                        {item.user.headline ? (
                          <span className="block truncate text-xs text-moons-muted">
                            {item.user.headline}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 sm:px-5">
          {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
          {sentCount > 0 && !error ? (
            <p className="mb-2 text-sm text-moons-blue">Sent to {sentCount} connection(s)</p>
          ) : null}
          <button
            type="button"
            disabled={sending || selected.size === 0}
            onClick={() => void handleForward()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-moons-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
          >
            <ForwardIcon className="h-4 w-4" />
            {sending
              ? 'Sending…'
              : selected.size
                ? `Forward to ${selected.size}`
                : 'Select connections'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9 18l6-6-6-6" />
    </Icon>
  );
}

function MediaCarousel({ media }: { media: FeedPost['media'] }) {
  const items = media.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [media]);

  if (!items.length) return null;

  const video = items.find((m) => m.type === 'VIDEO');
  if (video && items.length === 1) {
    const src = resolveAssetUrl(video.url);
    if (!src) return null;
    return (
      <video controls className="mt-3 max-h-[420px] w-full rounded-xl bg-black object-contain" src={src} />
    );
  }

  if (items.length === 1) {
    const src = resolveAssetUrl(items[0].url);
    if (!src) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="mt-3 max-h-[420px] w-full rounded-xl object-cover" />
    );
  }

  const current = items[Math.min(index, items.length - 1)];
  const src = resolveAssetUrl(current.url);
  const go = (next: number) => {
    setIndex(((next % items.length) + items.length) % items.length);
  };

  return (
    <div className="relative mt-3 overflow-hidden rounded-xl bg-surface">
      <div className="relative flex min-h-[220px] items-center justify-center bg-black/5">
        {current.type === 'VIDEO' && src ? (
          <video
            key={current.id}
            controls
            className="max-h-[420px] w-full object-contain"
            src={src}
          />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={src}
            alt=""
            className="max-h-[420px] w-full object-contain"
          />
        ) : null}

        <button
          type="button"
          onClick={() => go(index - 1)}
          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow transition hover:bg-black/75"
          aria-label="Previous media"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow transition hover:bg-black/75"
          aria-label="Next media"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
          {index + 1} / {items.length}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-2.5">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to media ${i + 1}`}
            className={`h-2 rounded-full transition ${
              i === index ? 'w-5 bg-moons-blue' : 'w-2 bg-border hover:bg-moons-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <path d="M1 1l22 22" />
    </Icon>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22V15" />
    </Icon>
  );
}

function CommentMoreMenu({
  canModerate,
  canReport,
  isHidden,
  onHide,
  onUnhide,
  onReport,
  onDelete,
}: {
  canModerate: boolean;
  canReport: boolean;
  isHidden: boolean;
  onHide: () => void;
  onUnhide: () => void;
  onReport: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!canModerate && !canReport) return null;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-moons-muted transition hover:bg-surface-elevated hover:text-heading ${
          open ? 'bg-surface-elevated text-heading' : ''
        }`}
        aria-label="Comment options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreIcon className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        >
          {canModerate ? (
            isHidden ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onUnhide();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-heading hover:bg-surface"
              >
                <EyeIcon className="h-4 w-4 text-moons-muted" />
                Unhide
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onHide();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-heading hover:bg-surface"
              >
                <EyeOffIcon className="h-4 w-4 text-moons-muted" />
                Hide
              </button>
            )
          ) : null}
          {canReport ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-heading hover:bg-surface"
            >
              <FlagIcon className="h-4 w-4 text-moons-muted" />
              Report
            </button>
          ) : null}
          {canModerate ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PostAuthorActions({
  post,
  busy,
  onConnect,
}: {
  post: FeedPost;
  busy: boolean;
  onConnect: () => void;
}) {
  const status = post.connectionStatus ?? 'NONE';
  if (status === 'SELF' || status === 'ACCEPTED') return null;

  const canConnect =
    status === 'NONE' || status === 'REJECTED' || status === 'CANCELLED';
  const isPending = status === 'PENDING';

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {canConnect ? (
        <button
          type="button"
          disabled={busy}
          onClick={onConnect}
          className="inline-flex items-center gap-1.5 rounded-full border border-moons-blue/40 px-3 py-1.5 text-xs font-semibold text-moons-blue transition hover:bg-moons-blue/10 disabled:opacity-60"
        >
          <UserPlusIcon className="h-3.5 w-3.5" />
          Connect
        </button>
      ) : isPending ? (
        <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-moons-muted">
          {post.connectionDirection === 'received' ? 'Respond on profile' : 'Pending'}
        </span>
      ) : null}
    </div>
  );
}

function PostMoreMenu({
  isMine,
  onEdit,
  onDelete,
  onCopyLink,
}: {
  isMine: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-moons-muted transition hover:bg-surface hover:text-heading ${
          open ? 'bg-surface text-heading' : ''
        }`}
        aria-label="More options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        >
          {isMine ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-heading hover:bg-surface"
            >
              <PencilIcon className="h-4 w-4 text-moons-muted" />
              Edit post
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onCopyLink();
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-heading hover:bg-surface"
          >
            <LinkIcon className="h-4 w-4 text-moons-muted" />
            Copy link
          </button>
          {isMine ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function FeedPostCard({
  post,
  onChange,
  onRemove,
}: {
  post: FeedPost;
  onChange: (next: FeedPost) => void;
  onRemove: (id: string) => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [showComments, setShowComments] = useState((post.recentComments?.length ?? 0) > 0);
  const [showLikers, setShowLikers] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [likersLoading, setLikersLoading] = useState(false);
  const [likers, setLikers] = useState<PostAuthor[]>(post.recentLikers ?? []);
  const [comments, setComments] = useState<PostCommentItem[]>(post.recentComments ?? []);
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentPreview, setCommentPreview] = useState<string | null>(null);
  const commentFileRef = useRef<HTMLInputElement>(null);
  const [hiddenCommentIds, setHiddenCommentIds] = useState<Set<string>>(() => new Set());
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const isMine = post.author.userId === user?.id;
  const isConnected =
    post.connectionStatus === 'ACCEPTED' || post.connectionStatus === 'SELF';

  useEffect(() => {
    if (!commentFile || !commentFile.type.startsWith('image/')) {
      setCommentPreview(null);
      return;
    }
    const url = URL.createObjectURL(commentFile);
    setCommentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [commentFile]);

  useEffect(() => {
    setComments(post.recentComments ?? []);
    setLikers(post.recentLikers ?? []);
    setEditBody(post.body);
    if ((post.recentComments?.length ?? 0) > 0) {
      setShowComments(true);
    }
  }, [post.id, post.body, post.recentComments, post.recentLikers]);

  async function toggleLike() {
    setBusy(true);
    setError('');
    try {
      const next = post.likedByMe ? await unlikePost(post.id) : await likePost(post.id);
      onChange(next);
      setLikers(next.recentLikers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update like');
    } finally {
      setBusy(false);
    }
  }

  async function loadComments() {
    setShowComments(true);
    try {
      const data = await fetchComments(post.id);
      setComments(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load comments');
    }
  }

  async function openLikers() {
    if (post.likeCount <= 0) return;
    setShowLikers(true);
    setLikersLoading(true);
    try {
      const data = await fetchLikes(post.id);
      setLikers(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load likes');
    } finally {
      setLikersLoading(false);
    }
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim() && !commentFile) return;
    setBusy(true);
    setError('');
    try {
      const created = await addComment(post.id, commentText.trim(), commentFile ?? undefined);
      setComments((prev) => [...prev, created]);
      setCommentText('');
      setCommentFile(null);
      setShowComments(true);
      onChange({
        ...post,
        commentCount: post.commentCount + 1,
        recentComments: [...(post.recentComments ?? []), created].slice(-3),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not comment');
    } finally {
      setBusy(false);
    }
  }

  async function handleConnect() {
    setBusy(true);
    setError('');
    try {
      await sendConnectionRequest(post.author.userId);
      onChange({ ...post, connectionStatus: 'PENDING', connectionDirection: 'sent' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    setBusy(true);
    try {
      await deletePost(post.id);
      onRemove(post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    setBusy(true);
    setError('');
    try {
      const next = await updatePost(post.id, editBody);
      onChange(next);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save edits');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/dashboard?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link');
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteComment(post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onChange({ ...post, commentCount: Math.max(0, post.commentCount - 1) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete comment');
    }
  }

  function hideComment(commentId: string) {
    setHiddenCommentIds((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
  }

  function unhideComment(commentId: string) {
    setHiddenCommentIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  }

  function handleReportComment(commentId: string) {
    if (
      !confirm(
        'Report this comment as inappropriate or spam? Our team will review it.',
      )
    ) {
      return;
    }
    setReportedCommentIds((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
    setError('');
    window.alert('Thanks — your report was submitted.');
  }

  const original = post.originalPost && !('unavailable' in post.originalPost) ? post.originalPost : null;

  return (
    <article className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <Link href={`/network/${post.author.userId}`}>
          <Avatar url={post.author.avatarUrl} name={post.author.fullName} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/network/${post.author.userId}`}
              className="font-semibold text-heading hover:text-moons-blue"
            >
              {post.author.fullName || 'MoonsJob member'}
            </Link>
            <span className="text-xs text-moons-muted">{timeAgo(post.createdAt)}</span>
          </div>
          {post.author.headline ? (
            <p className="truncate text-sm text-moons-muted">{post.author.headline}</p>
          ) : null}
        </div>
        {!isConnected ? (
          <PostAuthorActions
            post={post}
            busy={busy}
            onConnect={() => void handleConnect()}
          />
        ) : null}
        <PostMoreMenu
          isMine={isMine}
          onEdit={() => {
            setEditBody(post.body);
            setEditing(true);
          }}
          onDelete={() => void handleDelete()}
          onCopyLink={() => void handleCopyLink()}
        />
      </div>

      {copied ? (
        <p className="mt-2 text-xs font-medium text-moons-blue">Link copied</p>
      ) : null}

      {editing ? (
        <div className="mt-3 space-y-3">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={4}
            maxLength={3000}
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-heading outline-none ring-moons-blue/30 focus:ring-2"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setEditBody(post.body);
              }}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-heading hover:bg-surface disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || editBody.trim() === post.body.trim()}
              onClick={() => void handleSaveEdit()}
              className="rounded-full bg-moons-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-moons-blue-dark disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : post.body ? (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-heading">{post.body}</p>
      ) : null}
      <MediaCarousel media={post.media} />

      {original ? (
        <div className="mt-3 rounded-xl border border-border bg-surface p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-moons-muted">
            <RepostIcon className="h-3.5 w-3.5" />
            Shared from {original.author.fullName || 'a member'}
          </p>
          {original.body ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-heading">{original.body}</p>
          ) : null}
          <MediaCarousel media={original.media} />
        </div>
      ) : post.originalPost && 'unavailable' in post.originalPost ? (
        <p className="mt-3 rounded-xl border border-border bg-surface p-3 text-sm text-moons-muted">
          Original post unavailable
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 text-sm text-moons-muted">
        <button
          type="button"
          disabled={post.likeCount <= 0}
          onClick={() => void openLikers()}
          className="inline-flex items-center gap-1.5 hover:text-heading disabled:cursor-default disabled:hover:text-moons-muted"
        >
          <LikeIcon className="h-3.5 w-3.5" />
          {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
        </button>
        <button
          type="button"
          onClick={() => void loadComments()}
          className="inline-flex items-center gap-1.5 hover:text-heading"
        >
          <CommentIcon className="h-3.5 w-3.5" />
          {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      <LikersModal
        open={showLikers}
        loading={likersLoading}
        likers={likers}
        likeCount={post.likeCount}
        onClose={() => setShowLikers(false)}
      />

      <ForwardPostModal
        open={showForward}
        post={post}
        onClose={() => setShowForward(false)}
      />

      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleLike()}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition hover:bg-surface ${
            post.likedByMe ? 'text-moons-blue' : 'text-heading'
          }`}
        >
          <LikeIcon filled={post.likedByMe} className="h-4 w-4" />
          {post.likedByMe ? 'Liked' : 'Like'}
        </button>
        <button
          type="button"
          onClick={() => void loadComments()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-heading transition hover:bg-surface"
        >
          <CommentIcon className="h-4 w-4" />
          Comment
        </button>
        <button
          type="button"
          onClick={() => setShowForward(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-heading transition hover:bg-surface"
        >
          <ForwardIcon className="h-4 w-4" />
          Forward
        </button>
      </div>

      {showComments ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {comments
            .filter((c) => !reportedCommentIds.has(c.id))
            .map((c) => {
            const isHidden = hiddenCommentIds.has(c.id);
            return (
            <div key={c.id} className={`flex gap-2 ${isHidden ? 'opacity-40' : ''}`}>
              <Link href={`/network/${c.author.userId}`}>
                <Avatar url={c.author.avatarUrl} name={c.author.fullName} />
              </Link>
              <div className="min-w-0 flex-1 rounded-xl bg-surface px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/network/${c.author.userId}`}
                      className="text-sm font-semibold text-heading hover:text-moons-blue"
                    >
                      {displayName(c.author, 'Member')}
                    </Link>
                    <p className="text-xs text-moons-muted">
                      {isHidden ? 'Hidden · ' : ''}commented · {timeAgo(c.createdAt)}
                    </p>
                  </div>
                  <CommentMoreMenu
                    canModerate={isMine}
                    canReport={!isMine && !c.isMine}
                    isHidden={isHidden}
                    onHide={() => hideComment(c.id)}
                    onUnhide={() => unhideComment(c.id)}
                    onReport={() => handleReportComment(c.id)}
                    onDelete={() => void handleDeleteComment(c.id)}
                  />
                </div>
                {c.body.trim() &&
                !(
                  c.attachmentUrl &&
                  c.attachmentMimeType?.startsWith('image/') &&
                  c.body.trim().startsWith('📎')
                ) ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-heading">{c.body}</p>
                ) : null}
                {c.attachmentUrl ? (
                  c.attachmentMimeType?.startsWith('image/') ? (
                    <a
                      href={resolveAssetUrl(c.attachmentUrl) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block overflow-hidden rounded-lg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveAssetUrl(c.attachmentUrl) ?? undefined}
                        alt=""
                        className="max-h-48 w-auto max-w-full rounded-lg object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      href={resolveAssetUrl(c.attachmentUrl) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-semibold text-moons-blue hover:bg-moons-blue/5"
                    >
                      <PaperclipIcon className="h-3.5 w-3.5" />
                      {c.attachmentFileName || 'Open file'}
                    </a>
                  )
                ) : null}
              </div>
            </div>
            );
          })}
          {post.commentCount > comments.length ? (
            <button
              type="button"
              onClick={() => void loadComments()}
              className="text-sm font-medium text-moons-blue hover:underline"
            >
              View all {post.commentCount} comments
            </button>
          ) : null}
          <form onSubmit={submitComment} className="space-y-2">
            {commentFile ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                {commentPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={commentPreview}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <PaperclipIcon className="h-4 w-4 text-moons-blue" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-heading">
                  {commentFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setCommentFile(null)}
                  className="text-xs font-semibold text-moons-muted hover:text-heading"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <div className="flex gap-2">
              <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-moons-muted transition hover:border-moons-blue/40 hover:bg-moons-blue/5 hover:text-moons-blue">
                <PaperclipIcon className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
                <input
                  ref={commentFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setCommentFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-moons-blue/30"
              />
              <button
                type="submit"
                disabled={busy || (!commentText.trim() && !commentFile)}
                className="inline-flex items-center gap-1.5 rounded-full bg-moons-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <SendIcon className="h-3.5 w-3.5" />
                Post
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </article>
  );
}

function Composer({ onCreated }: { onCreated: (post: FeedPost) => void }) {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasVideo = files.some((f) => f.type.startsWith('video/'));
  const canAddMore = !hasVideo && files.length < 10;
  const canPost = Boolean(body.trim() || files.length > 0);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError('');
  }

  function addFiles(incoming: FileList | File[]) {
    const next = Array.from(incoming);
    if (!next.length) return;

    setFiles((prev) => {
      const combined = [...prev, ...next];
      const images = combined.filter((f) => f.type.startsWith('image/'));
      const videos = combined.filter((f) => f.type.startsWith('video/'));

      if (images.length && videos.length) {
        setError('A post can include images or one video, not both');
        return prev;
      }
      if (videos.length > 1) {
        setError('Only one video per post is allowed');
        return videos.slice(0, 1);
      }
      if (videos.length === 1) {
        setError('');
        return [videos[0]];
      }
      setError('');
      return images.slice(0, 10);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() && files.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const post = await createPost(body, files);
      onCreated(post);
      setBody('');
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border-2 bg-white p-4 transition duration-200 dark:bg-surface-elevated ${
        focused ? 'border-moons-blue shadow-md' : 'border-border'
      }`}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={2}
        maxLength={3000}
        placeholder="Share an update with your network…"
        className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-heading outline-none placeholder:text-moons-muted focus:border-moons-blue/40"
      />

      {files.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${file.size}-${i}`}
              className="relative h-20 w-20 overflow-hidden rounded-xl bg-surface sm:h-24 sm:w-24"
            >
              {file.type.startsWith('video/') ? (
                <video src={previews[i]} className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[i]} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow transition hover:bg-black"
                aria-label="Remove media"
                title="Remove"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {canAddMore ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-moons-muted transition hover:border-moons-blue/40 hover:text-moons-blue sm:h-24 sm:w-24"
              aria-label="Add more photos"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="text-xs font-semibold">Add</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-heading transition hover:border-moons-blue/40 hover:bg-moons-blue/5">
          <ImageIcon className="h-4 w-4 text-moons-blue" />
          {files.length > 0 ? 'Add more' : 'Add photo / video'}
          <input
            ref={fileInputRef}
            type="file"
            accept={
              hasVideo
                ? 'video/mp4,video/webm,video/quicktime'
                : files.length > 0
                  ? 'image/jpeg,image/png,image/webp,image/gif'
                  : 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'
            }
            multiple={!hasVideo}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files ?? []);
              e.target.value = '';
            }}
          />
        </label>

        <button
          type="submit"
          disabled={busy || !canPost}
          className="inline-flex items-center gap-1.5 rounded-full bg-moons-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendIcon className="h-3.5 w-3.5" />
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

function feedRootId(post: FeedPost) {
  if (post.originalPost && !('unavailable' in post.originalPost)) {
    return post.originalPost.id;
  }
  if (post.originalPost && 'unavailable' in post.originalPost) {
    return post.originalPost.id;
  }
  return post.id;
}

function dedupeFeedPosts(posts: FeedPost[]) {
  const seenIds = new Set<string>();
  const seenRoots = new Set<string>();
  return posts.filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    const rootId = feedRootId(p);
    if (seenRoots.has(rootId)) return false;
    seenRoots.add(rootId);
    return true;
  });
}

export function DashboardFeed({ highlightPostId }: { highlightPostId?: string }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextPage = 1, append = false) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFeed(nextPage, 20);
      setPosts((prev) => {
        const merged = append ? [...prev, ...data.items] : data.items;
        return dedupeFeedPosts(merged);
      });
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load feed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(1, false);
  }, []);

  const ordered = useMemo(() => {
    if (!highlightPostId) return posts;
    const hit = posts.find((p) => p.id === highlightPostId);
    if (!hit) return posts;
    return [hit, ...posts.filter((p) => p.id !== highlightPostId)];
  }, [posts, highlightPostId]);

  return (
    <div className="space-y-4">
      <Composer
        onCreated={(post) => {
          setPosts((prev) => [post, ...prev]);
        }}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {ordered.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          onChange={(next) => setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
          onRemove={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
        />
      ))}

      {!loading && ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-elevated p-8 text-center">
          <EmptyFeedIcon />
          <p className="mt-3 font-semibold text-heading">No posts yet</p>
          <p className="mt-1 text-sm text-moons-muted">
            Connect with people and share the first update.
          </p>
        </div>
      ) : null}

      {hasMore ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(page + 1, true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-heading hover:bg-surface disabled:opacity-60"
        >
          <RepostIcon className="h-4 w-4" />
          {loading ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
    </div>
  );
}
