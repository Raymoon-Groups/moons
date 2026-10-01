'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type BotSide = 'recruiter' | 'candidate';

const SIDES: Record<
  BotSide,
  {
    image: string;
    imageAlt: string;
    eyebrow: string;
    headline: string;
    blurb: string;
    cta: string;
    href: string;
    items: { label: string; detail: string }[];
  }
> = {
  recruiter: {
    image: '/landing/recruiter-2.png',
    imageAlt: 'Recruiter using Moons on a laptop',
    eyebrow: 'For recruiters',
    headline: 'Hire faster with MoonsJob',
    blurb: 'Matching, screening, and follow-ups — so you focus on the right people.',
    cta: 'Hire with Moons',
    href: '/register?role=recruiter',
    items: [
      { label: 'Match talent fast', detail: 'Candidates fitted to skills, location, and experience.' },
      { label: 'Screen smarter', detail: 'Strong profiles and answers surface first.' },
      { label: 'Applicant nudges', detail: 'Reminders when applications land or shortlists stall.' },
    ],
  },
  candidate: {
    image: '/landing/candidtae-1.png',
    imageAlt: 'Candidate celebrating with a resume',
    eyebrow: 'For candidates',
    headline: 'Land roles with MoonsJob',
    blurb: 'Smarter matches, clearer next steps, and fewer missed replies.',
    cta: 'Find your next role',
    href: '/register',
    items: [
      { label: 'Roles that fit you', detail: 'Openings from your profile, skills, and resume.' },
      { label: 'Application clarity', detail: 'Know where you stand and how to get more replies.' },
      { label: 'Never miss a reply', detail: 'Recruiter messages and invites flagged instantly.' },
    ],
  },
};

export function BotBridgeSection() {
  const [side, setSide] = useState<BotSide>('recruiter');
  const [visibleBullets, setVisibleBullets] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const pauseUntilRef = useRef(0);

  function selectSide(next: BotSide) {
    if (next === side) return;
    setSide(next);
    setAnimKey((k) => k + 1);
    pauseUntilRef.current = Date.now() + 12000;
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setSide((prev) => {
        setAnimKey((k) => k + 1);
        return prev === 'recruiter' ? 'candidate' : 'recruiter';
      });
    }, 9000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setVisibleBullets(0);
    const timers: number[] = [];
    SIDES[side].items.forEach((_, i) => {
      timers.push(window.setTimeout(() => setVisibleBullets(i + 1), 320 + i * 420));
    });
    return () => timers.forEach(clearTimeout);
  }, [side, animKey]);

  const content = SIDES[side];

  return (
    <section className="px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-8">
      <div className="bot-bridge relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[#07090f] sm:rounded-[1.75rem] md:rounded-[2rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_40%,rgba(74,127,212,0.16),transparent_55%)]"
        />

        <div className="relative grid md:grid-cols-2 md:h-[440px] lg:h-[480px]">
          {/* Image — second on mobile, left on desktop */}
          <div className="relative order-2 h-[220px] sm:h-[260px] md:order-1 md:h-full">
            {(['recruiter', 'candidate'] as const).map((key) => {
              const active = side === key;
              return (
                <div
                  key={key}
                  className={`absolute inset-0 px-4 pt-2 transition-opacity duration-500 sm:px-6 md:px-10 md:pt-10 ${
                    active ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                  aria-hidden={!active}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={SIDES[key].image}
                      alt={SIDES[key].imageAlt}
                      fill
                      className="object-contain object-bottom"
                      sizes="(max-width:768px) 90vw, 480px"
                      priority={key === 'recruiter'}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Copy — first on mobile, right on desktop */}
          <div className="relative order-1 flex flex-col px-4 pb-2 pt-5 sm:px-6 sm:pt-6 md:order-2 md:h-full md:justify-center md:px-10 md:py-10 lg:px-12">
            <div className="mb-4 flex justify-center md:mb-5 md:justify-end">
              <div
                className="relative grid w-full max-w-[17rem] grid-cols-2 overflow-hidden rounded-full border border-white/15 bg-white/[0.05] p-1 sm:w-auto sm:max-w-none"
                role="tablist"
                aria-label="MoonsJob audience"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-moons-blue transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transform: side === 'candidate' ? 'translateX(100%)' : 'translateX(0)',
                  }}
                />
                {(['recruiter', 'candidate'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={side === key}
                    onClick={() => selectSide(key)}
                    className={`relative z-10 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:py-1.5 ${
                      side === key ? 'text-white' : 'text-white/55 hover:text-white'
                    }`}
                  >
                    {key === 'recruiter' ? 'Recruiter' : 'Candidate'}
                  </button>
                ))}
              </div>
            </div>

            <div key={animKey} className="text-center md:min-h-[7.5rem] md:text-left">
              <p className="bot-bridge-copy-in text-[10px] font-semibold uppercase tracking-[0.16em] text-moons-blue">
                MoonsJob · {content.eyebrow}
              </p>
              <h2
                className="bot-bridge-copy-in mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl md:mt-2 md:min-h-[3.4rem] md:text-[1.85rem] md:leading-tight"
                style={{ animationDelay: '50ms' }}
              >
                {content.headline}
              </h2>
              <p
                className="bot-bridge-copy-in mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55 md:mx-0"
                style={{ animationDelay: '100ms' }}
              >
                {content.blurb}
              </p>
            </div>

            {/* Bullets sit under image on mobile via order in a nested flow */}
            <div className="mt-4 hidden md:mt-5 md:block">
              <FeatureList
                side={side}
                items={content.items}
                visibleBullets={visibleBullets}
                href={content.href}
                cta={content.cta}
              />
            </div>
          </div>

          {/* Mobile-only features under image */}
          <div className="order-3 px-4 pb-6 pt-1 sm:px-6 md:hidden">
            <FeatureList
              side={side}
              items={content.items}
              visibleBullets={visibleBullets}
              href={content.href}
              cta={content.cta}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureList({
  side,
  items,
  visibleBullets,
  href,
  cta,
}: {
  side: BotSide;
  items: { label: string; detail: string }[];
  visibleBullets: number;
  href: string;
  cta: string;
}) {
  return (
    <>
      <ul className="space-y-2.5 sm:space-y-3 md:min-h-[6.5rem]">
        {items.map((item, index) => (
          <li
            key={`${side}-${item.label}`}
            className={`flex gap-2.5 transition-all duration-500 ease-out sm:gap-3 ${
              index < visibleBullets ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moons-blue" />
            <p className="text-sm leading-snug">
              <span className="font-semibold text-white">{item.label}</span>
              <span className="text-white/45"> — {item.detail}</span>
            </p>
          </li>
        ))}
      </ul>

      <div
        className={`mt-5 transition-all duration-500 ease-out sm:mt-6 ${
          visibleBullets >= items.length ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center rounded-full bg-moons-blue px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-moons-blue-dark sm:w-auto"
        >
          {cta}
        </Link>
      </div>
    </>
  );
}
