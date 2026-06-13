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
    <section className="relative min-h-[520px] overflow-x-clip overflow-y-visible px-4 pb-16 pt-16 sm:px-6 md:min-h-[600px] md:pb-28 md:pt-28 lg:px-8">
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
        <h1 className="text-4xl font-bold leading-[1.12] tracking-tight md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-b from-white via-white to-white/75 bg-clip-text text-transparent">
            Discover your next role,
          </span>
          <br />
          <span className="bg-gradient-to-r from-white via-slate-200 to-white/80 bg-clip-text text-transparent">
            across India
          </span>
        </h1>
        <p className="mt-6 text-base font-medium text-white/80 md:text-lg">
          5 lakh+ openings · Top companies hiring · Apply in minutes
        </p>

        <div className="relative z-20 mx-auto mt-14 w-full max-w-5xl overflow-visible lg:max-w-6xl">
          <HeroJobSearchForm variant="landing" />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-semibold text-white/60">Trending:</span>
          {popularSearches.slice(0, 5).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => router.push(buildJobsSearchUrl({ q: term }))}
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20"
            >
              {term}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-4 flex max-w-5xl flex-wrap justify-center gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => router.push(buildJobsSearchUrl({ q: filter }))}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
