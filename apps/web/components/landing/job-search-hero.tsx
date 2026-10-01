'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HeroJobSearchForm } from '@/components/jobs/hero-job-search-form';
import { buildJobsSearchUrl } from '@/lib/jobs-search';
import { popularSearches, quickFilters } from '@/lib/landing-data';

const HOME_BANNER = '/banner_home2.png';

export function JobPortalHero() {
  const router = useRouter();

  return (
    <section className="relative min-h-[380px] overflow-x-clip overflow-y-visible px-4 pb-10 pt-10 sm:min-h-[480px] sm:px-6 sm:pb-14 sm:pt-14 md:min-h-[600px] md:pb-28 md:pt-28 lg:px-8">
      <Image
        src={HOME_BANNER}
        alt=""
        fill
        priority
        quality={75}
        className="object-cover object-center brightness-[0.55] saturate-[0.85]"
        sizes="100vw"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0e17]/70 via-[#1a2744]/55 to-[#0a0e17]/80"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <h1 className="text-[1.75rem] font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-b from-white via-white to-white/75 bg-clip-text text-transparent">
            Discover your next role,
          </span>
          <br />
          <span className="bg-gradient-to-r from-white via-slate-200 to-white/80 bg-clip-text text-transparent">
            across India
          </span>
        </h1>
        <p className="mt-4 text-sm font-medium text-white/80 sm:mt-6 sm:text-base md:text-lg">
          5 lakh+ openings · Top companies hiring · Apply in minutes
        </p>

        <div className="relative z-20 mx-auto mt-8 w-full max-w-5xl overflow-visible sm:mt-12 md:mt-14 lg:max-w-6xl">
          <HeroJobSearchForm variant="landing" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-10">
          <span className="text-xs font-semibold text-white/60 sm:text-sm">Trending:</span>
          {popularSearches.slice(0, 5).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => router.push(buildJobsSearchUrl({ q: term }))}
              className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              {term}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-3 flex max-w-5xl flex-wrap justify-center gap-2 sm:mt-4">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => router.push(buildJobsSearchUrl({ q: filter }))}
              className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/85 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
