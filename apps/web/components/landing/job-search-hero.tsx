'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { popularSearches, quickFilters } from '@/lib/landing-data';

const HOME_BANNER = '/banner_home2.png';

export function JobPortalHero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (location.trim()) params.set('location', location.trim());
    if (experience) params.set('experience', experience);
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : '/jobs');
  }

  return (
    <section className="relative min-h-[520px] overflow-hidden px-4 pb-16 pt-16 sm:px-6 md:min-h-[600px] md:pb-28 md:pt-28 lg:px-8">
      <Image
        src={HOME_BANNER}
        alt=""
        fill
        priority
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

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-14 w-full max-w-5xl lg:max-w-6xl"
        >
          <div className="flex flex-col items-stretch rounded-3xl border border-border bg-surface-elevated p-3 shadow-[0_8px_32px_rgba(26,39,68,0.08)] sm:flex-row sm:items-center sm:rounded-full sm:p-2">
            <label className="flex min-w-0 flex-1 cursor-text flex-col border-b border-border px-5 py-3.5 text-left sm:border-b-0 sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-blue">What</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, skill, or company"
                className="mt-1 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-moons-muted md:text-base"
              />
            </label>

            <div className="hidden h-12 w-px shrink-0 bg-border sm:block" aria-hidden />

            <label className="flex min-w-0 flex-1 cursor-text flex-col border-b border-border px-5 py-3.5 text-left sm:border-b-0 sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-blue">Where</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or remote"
                className="mt-1 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-moons-muted md:text-base"
              />
            </label>

            <div className="hidden h-12 w-px shrink-0 bg-border sm:block" aria-hidden />

            <label className="flex min-w-0 flex-1 cursor-text flex-col px-5 py-3.5 text-left sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-blue">Experience</span>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className={`mt-1 w-full cursor-pointer bg-transparent text-sm outline-none md:text-base ${
                  experience ? 'text-foreground' : 'text-moons-muted'
                }`}
              >
                <option value="">Add experience level</option>
                <option value="fresher">Fresher</option>
                <option value="1-3">1–3 years</option>
                <option value="3-6">3–6 years</option>
                <option value="6+">6+ years</option>
              </select>
            </label>

            <button
              type="submit"
              aria-label="Search jobs"
              className="mx-auto mt-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-moons-blue text-white shadow-[0_4px_16px_rgba(74,127,212,0.35)] transition hover:bg-moons-blue-dark sm:mx-2 sm:mt-0 sm:h-[3.25rem] sm:w-[3.25rem] lg:h-14 lg:w-14"
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-semibold text-white/60">Trending:</span>
          {popularSearches.slice(0, 5).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
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
              onClick={() => setQuery(filter)}
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

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
