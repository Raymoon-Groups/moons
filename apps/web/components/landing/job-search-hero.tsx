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
    <section className="bg-gradient-to-b from-[#eef3ff] via-[#e8efff] to-[#f7f8fa] pb-6 pt-8">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-[26px] font-bold leading-tight text-moons-navy md:text-[32px]">
          Find your dream job now
        </h1>
        <p className="mt-2 text-sm text-moons-muted">
          5 lakh+ active jobs · 50,000+ recruiters · Register to apply
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-6 overflow-hidden rounded-lg bg-white shadow-[0_4px_24px_rgba(69,126,255,0.15)] ring-1 ring-slate-200/80"
        >
          <div className="flex flex-col md:flex-row md:items-stretch">
            <label className="flex flex-1 items-center gap-2 border-b border-slate-200 px-4 py-3.5 md:border-b-0 md:border-r">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter skills / designations / companies"
                className="w-full text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex flex-1 items-center gap-2 border-b border-slate-200 px-4 py-3.5 md:border-b-0 md:border-r">
              <LocationIcon />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                className="w-full text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="flex items-center border-b border-slate-200 px-4 md:w-36 md:border-b-0 md:border-r">
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full cursor-pointer bg-transparent py-3.5 text-sm text-slate-700 outline-none"
              >
                <option value="">Select experience</option>
                <option value="fresher">Fresher</option>
                <option value="1-3">1–3 yrs</option>
                <option value="3-6">3–6 yrs</option>
                <option value="6+">6+ yrs</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-moons-orange px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-moons-orange-dark md:min-w-[130px]"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Popular:</span>
          {popularSearches.slice(0, 5).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-moons-blue hover:text-moons-blue"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-5xl flex-wrap justify-center gap-2 px-4">
        {quickFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setQuery(filter)}
            className="rounded border border-moons-blue/30 bg-white px-3 py-1 text-xs font-medium text-moons-blue transition hover:bg-blue-50"
          >
            {filter}
          </button>
        ))}
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    </svg>
  );
}
