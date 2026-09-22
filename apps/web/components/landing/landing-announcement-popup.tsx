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

function slideMs(item: ActiveAnnouncement | undefined) {
  const sec = item?.durationSec ?? 5;
  return Math.min(30, Math.max(3, sec)) * 1000;
}

export function LandingAnnouncementPopup() {
  const [items, setItems] = useState<ActiveAnnouncement[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    let active = true;

    apiFetch<ActiveAnnouncement[] | ActiveAnnouncement | null>('/announcements/active')
      .then((data) => {
        if (!active) return;
        const list = (Array.isArray(data) ? data : data ? [data] : []).filter(
          (item) => Boolean(item.imageUrl),
        );
        if (!list.length) return;
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

  useEffect(() => {
    if (!open || !items.length) return;

    const current = items[index] ?? items[0];
    const ms = slideMs(current);

    if (items.length === 1) {
      const timer = setTimeout(() => dismiss(), ms);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(goNext, ms);
    return () => clearTimeout(timer);
  }, [open, items, index, goNext, dismiss]);

  if (!open || !items.length) return null;

  const announcement = items[index] ?? items[0];
  const showCarousel = items.length > 1;
  const imageSrc =
    resolveAssetUrl(announcement.imageUrl) ?? announcement.imageUrl ?? null;
  const hasText = Boolean(announcement.title?.trim() || announcement.body?.trim());

  const hasCta = Boolean(announcement.ctaLabel && announcement.ctaUrl);
  const hasFooter = hasText || hasCta;
  const imageOnly = Boolean(imageSrc) && !hasFooter;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-roledescription={showCarousel ? 'carousel' : undefined}
        aria-label={announcement.title?.trim() || 'Announcement'}
        className={`relative max-h-[min(92vh,920px)] w-auto max-w-[min(96vw,56rem)] overflow-hidden rounded-3xl shadow-2xl ${
          imageOnly ? 'bg-transparent' : 'bg-surface-elevated'
        }`}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close announcement"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 sm:right-4 sm:top-4"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {imageSrc ? (
          <div className="relative leading-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={announcement.id}
              src={imageSrc}
              alt={announcement.title?.trim() || ''}
              className="block h-auto max-h-[min(85vh,820px)] w-auto max-w-full object-contain"
            />
            {showCarousel ? (
              <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Go to announcement ${i + 1}`}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => setIndex(i)}
                    className={`h-2.5 w-2.5 rounded-full shadow transition ${
                      i === index ? 'bg-moons-blue' : 'bg-white/80'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {hasFooter ? (
          <div className="p-6 sm:p-8">
            {announcement.title?.trim() ? (
              <h2 className="pr-10 text-2xl font-bold text-foreground sm:text-3xl">
                {announcement.title}
              </h2>
            ) : null}
            {announcement.body?.trim() ? (
              <p
                className={`text-base leading-relaxed text-moons-muted sm:text-lg ${
                  announcement.title?.trim() ? 'mt-3' : ''
                }`}
              >
                {announcement.body}
              </p>
            ) : null}
            {hasCta ? (
              <Link
                href={announcement.ctaUrl!}
                onClick={dismiss}
                className="mt-6 inline-flex rounded-full bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-moons-blue-dark sm:text-base"
              >
                {announcement.ctaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
