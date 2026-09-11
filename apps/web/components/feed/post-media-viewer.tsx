'use client';

import { useEffect, useState } from 'react';
import type { FeedPost } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';

function formatCount(n: number) {
  if (n <= 0) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ dir, className }: { dir: 'left' | 'right'; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {dir === 'left' ? (
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function PostMediaViewer({
  open,
  media,
  initialIndex = 0,
  caption,
  authorName,
  timeLabel,
  liked = false,
  likeCount = 0,
  commentCount = 0,
  likeDisabled = false,
  onLike,
  onComment,
  onShare,
  onClose,
}: {
  open: boolean;
  media: FeedPost['media'];
  initialIndex?: number;
  caption?: string;
  authorName?: string | null;
  timeLabel?: string;
  liked?: boolean;
  likeCount?: number;
  commentCount?: number;
  likeDisabled?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onClose: () => void;
}) {
  const items = media.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const [index, setIndex] = useState(initialIndex);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1)));
      setCaptionExpanded(false);
    }
  }, [open, initialIndex, items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setIndex((i) => (i - 1 + items.length) % items.length);
      }
      if (e.key === 'ArrowRight') {
        setIndex((i) => (i + 1) % items.length);
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, items.length]);

  if (!open || !items.length) return null;

  const current = items[Math.min(index, items.length - 1)];
  const src = resolveAssetUrl(current.url);
  const hasCaption = Boolean(caption?.trim());
  const showActions = Boolean(onLike || onComment || onShare);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black" role="dialog" aria-modal="true">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {current.type === 'VIDEO' && src ? (
          <video
            key={current.id}
            controls
            autoPlay
            className="max-h-full max-w-full object-contain"
            src={src}
          />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={src}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={onClose}
          />
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Close"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {items.length > 1 ? (
          <>
            <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {index + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
              aria-label="Previous"
            >
              <ChevronIcon dir="left" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="absolute right-16 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
              aria-label="Next"
            >
              <ChevronIcon dir="right" className="h-5 w-5" />
            </button>
          </>
        ) : null}

        {showActions ? (
          <div className="absolute bottom-36 right-3 z-10 flex flex-col items-center gap-4 sm:bottom-40 sm:right-5">
            {onLike ? (
              <button
                type="button"
                disabled={likeDisabled}
                onClick={onLike}
                className="flex flex-col items-center gap-1 disabled:opacity-60"
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                  <HeartIcon filled={liked} className={`h-6 w-6 ${liked ? 'text-[#ff4d6d]' : ''}`} />
                </span>
                <span className="text-xs font-semibold text-white">
                  {likeCount > 0 ? formatCount(likeCount) : 'Like'}
                </span>
              </button>
            ) : null}

            {onComment ? (
              <button
                type="button"
                onClick={onComment}
                className="flex flex-col items-center gap-1"
                aria-label="Comment"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                  <ChatIcon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-white">
                  {commentCount > 0 ? formatCount(commentCount) : 'Comment'}
                </span>
              </button>
            ) : null}

            {onShare ? (
              <button
                type="button"
                onClick={onShare}
                className="flex flex-col items-center gap-1"
                aria-label="Forward"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                  <ShareIcon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-white">Forward</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasCaption || authorName ? (
        <div
          className={`shrink-0 bg-black/70 px-5 py-4 text-white ${showActions ? 'pr-20 sm:pr-24' : ''}`}
        >
          {authorName ? (
            <p className="text-sm font-bold">
              {authorName}
              {timeLabel ? (
                <span className="font-normal text-white/60"> · {timeLabel}</span>
              ) : null}
            </p>
          ) : null}
          {hasCaption ? (
            captionExpanded ? (
              <p className="mt-1.5 max-h-[30vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                {caption}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setCaptionExpanded(true)}
                className="mt-1.5 line-clamp-3 text-left text-sm leading-relaxed text-white/90"
              >
                {caption}
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
