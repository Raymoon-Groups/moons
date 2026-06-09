'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { popularSearches, quickFilters } from '@/lib/landing-data';

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
    <section className="bg-gradient-to-r from-amber-50/90 via-white to-cyan-50/90 px-4 pb-16 pt-16 sm:px-6 md:pb-28 md:pt-28 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-moons-navy md:text-5xl lg:text-6xl">
          Discover your next role,
          <br />
          across India
        </h1>
        <p className="mt-6 text-base text-moons-muted md:text-lg">
          5 lakh+ openings · Top companies hiring · Apply in minutes
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-14 w-full max-w-5xl lg:max-w-6xl"
        >
          <div className="flex flex-col items-stretch rounded-3xl bg-white p-3 shadow-[0_8px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:flex-row sm:items-center sm:rounded-full sm:p-2">
            <label className="flex min-w-0 flex-1 cursor-text flex-col border-b border-slate-100 px-5 py-3.5 text-left sm:border-b-0 sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-navy">What</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, skill, or company"
                className="mt-1 w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400 md:text-base"
              />
            </label>

            <div className="hidden h-12 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

            <label className="flex min-w-0 flex-1 cursor-text flex-col border-b border-slate-100 px-5 py-3.5 text-left sm:border-b-0 sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-navy">Where</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or remote"
                className="mt-1 w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400 md:text-base"
              />
            </label>

            <div className="hidden h-12 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

            <label className="flex min-w-0 flex-1 cursor-text flex-col px-5 py-3.5 text-left sm:px-6 sm:py-4 lg:px-8">
              <span className="text-xs font-semibold text-moons-navy">Experience</span>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className={`mt-1 w-full cursor-pointer bg-transparent text-sm outline-none md:text-base ${
                  experience ? 'text-slate-600' : 'text-slate-400'
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
              className="mx-auto mt-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-moons-orange text-white transition hover:bg-moons-orange-dark sm:mx-2 sm:mt-0 sm:h-[3.25rem] sm:w-[3.25rem] lg:h-14 lg:w-14"
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Trending:</span>
          {popularSearches.slice(0, 5).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs text-slate-600 backdrop-blur-sm transition hover:border-moons-blue hover:text-moons-blue"
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
              className="rounded-full border border-moons-blue/25 bg-white/80 px-3 py-1 text-xs font-medium text-moons-blue backdrop-blur-sm transition hover:bg-blue-50"
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
