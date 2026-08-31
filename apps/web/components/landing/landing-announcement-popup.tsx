'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';

type ActiveAnnouncement = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  durationSec: number;
  updatedAt: string;
};

const SLIDE_MS = 3000;

function sessionKey(items: ActiveAnnouncement[]) {
  return `moons_announcements_dismissed_${items
    .map((item) => `${item.id}:${item.updatedAt}`)
    .join('|')}`;
}

function ArrowButton({
  direction,
  onClick,
  label,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 sm:h-11 sm:w-11"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

export function LandingAnnouncementPopup() {
  const [items, setItems] = useState<ActiveAnnouncement[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const dismiss = useCallback((list: ActiveAnnouncement[]) => {
    setOpen(false);
    if (!list.length) return;
    try {
      sessionStorage.setItem(sessionKey(list), '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;

    apiFetch<ActiveAnnouncement[] | ActiveAnnouncement | null>('/announcements/active')
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        if (!list.length) return;
        try {
          if (sessionStorage.getItem(sessionKey(list)) === '1') return;
        } catch {
          // ignore storage errors
        }
        setItems(list);
        setIndex(0);
        setOpen(true);
      })
      .catch(() => {
        // silent — landing page should not break if API is down
      });

    return () => {
      active = false;
    };
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => (items.length ? (current + 1) % items.length : 0));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setIndex((current) =>
      items.length ? (current - 1 + items.length) % items.length : 0,
    );
  }, [items.length]);

  useEffect(() => {
    if (!open || !items.length) return;

    if (items.length === 1) {
      const timer = setTimeout(() => dismiss(items), SLIDE_MS);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(goNext, SLIDE_MS);
    return () => clearInterval(timer);
  }, [open, items, goNext, index, dismiss]);

  if (!open || !items.length) return null;

  const announcement = items[index] ?? items[0];
  const showCarousel = items.length > 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-roledescription={showCarousel ? 'carousel' : undefined}
        aria-label={announcement.title}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-surface-elevated shadow-2xl"
      >
        <button
          type="button"
          onClick={() => dismiss(items)}
          aria-label="Close announcement"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 sm:right-4 sm:top-4"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showCarousel ? (
          <>
            <div className="absolute left-2 top-1/2 z-20 -translate-y-1/2 sm:left-3">
              <ArrowButton direction="left" label="Previous announcement" onClick={goPrev} />
            </div>
            <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2 sm:right-3">
              <ArrowButton direction="right" label="Next announcement" onClick={goNext} />
            </div>
          </>
        ) : null}

        {announcement.imageUrl ? (
          <div className="relative h-56 w-full overflow-hidden bg-surface sm:h-80 md:h-[26rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={announcement.id}
              src={resolveAssetUrl(announcement.imageUrl) ?? announcement.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className={`p-6 sm:p-8 ${showCarousel ? 'px-12 sm:px-16' : ''}`}>
          <h2 className="pr-10 text-2xl font-bold text-foreground sm:text-3xl">{announcement.title}</h2>
          {announcement.body ? (
            <p className="mt-3 text-base leading-relaxed text-moons-muted sm:text-lg">
              {announcement.body}
            </p>
          ) : null}
          {announcement.ctaLabel && announcement.ctaUrl ? (
            <Link
              href={announcement.ctaUrl}
              onClick={() => dismiss(items)}
              className="mt-6 inline-flex rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark sm:text-base"
            >
              {announcement.ctaLabel}
            </Link>
          ) : null}

          {showCarousel ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Go to announcement ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === index ? 'bg-moons-blue' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
