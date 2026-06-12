import Image from 'next/image';
import Link from 'next/link';
import { CareerServicesSection } from '@/components/landing/career-services-section';
import { IndiaJobsMap } from '@/components/landing/india-jobs-map';
import { JobCard } from '@/components/landing/job-card';
import {
  categories,
  landingImages,
  mockJobs,
  popularSearches,
  stats,
  topCompanies,
} from '@/lib/landing-data';

export function StatsBar() {
  return (
    <section className="border-y border-border bg-surface px-4 py-16 md:py-20">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-moons-navy md:text-4xl">
          Trusted by jobseekers nationwide
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-moons-muted md:text-lg">
          Join lakhs of professionals and thousands of recruiters on Moons
        </p>

        <div className="mt-14 grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="inline-flex flex-col items-center">
                <p className="text-3xl font-bold text-moons-blue md:text-4xl lg:text-[2.75rem]">
                  {stat.value}
                </p>
                <span className="mt-2 h-1 w-full min-w-[3.5rem] rounded-full bg-moons-blue/40 md:min-w-[4.5rem]" />
              </div>
              <p className="mt-5 text-sm font-bold text-moons-navy md:text-base">
                {stat.label}
              </p>
              <p className="mt-1 text-xs text-moons-muted md:text-sm">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrowseCategories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-moons-navy md:text-xl">
          Browse jobs by category
        </h2>
        <Link href="/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
          View all →
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={`/jobs?q=${cat.slug}`}
            className="group overflow-hidden rounded-lg border border-border bg-surface-elevated transition hover:border-moons-blue hover:shadow-md"
          >
            <div className="relative aspect-[5/3] overflow-hidden">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width:640px) 50vw, 25vw"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-moons-navy group-hover:text-moons-blue">
                {cat.name}
              </p>
              <p className="text-xs text-moons-muted">{cat.count} jobs</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TrendingJobs() {
  return (
    <section className="bg-surface-elevated py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-moons-navy md:text-xl">
            Trending jobs on Moons
          </h2>
          <Link href="/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
            View all jobs →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {mockJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TopCompanies() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-center text-lg font-bold text-moons-navy md:text-xl">
        Top companies hiring now
      </h2>
      <p className="mt-1 text-center text-sm text-moons-muted">
        Explore openings at India&apos;s leading employers
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {topCompanies.map((co) => (
          <Link
            key={co.name}
            href={`/jobs?q=${encodeURIComponent(co.name)}`}
            className="group relative aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-slate-200 transition hover:ring-moons-blue hover:shadow-lg"
          >
            <Image
              src={co.image}
              alt={co.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-base font-bold text-white md:text-lg">{co.name}</p>
              <div className="mt-2 h-px w-10 bg-surface-elevated/60" />
              <p className="mt-2 text-xs leading-relaxed text-white/85 md:text-sm">
                {co.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function JobsByCity() {
  return (
    <section className="bg-surface-elevated py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-lg font-bold text-moons-navy md:text-xl">
          Jobs by city
        </h2>
        <p className="mt-1 text-sm text-moons-muted">
          Find opportunities in top metro cities
        </p>

        <IndiaJobsMap />
      </div>
    </section>
  );
}

export function CareerServices() {
  return <CareerServicesSection />;
}

export function PopularSearchTags() {
  return (
    <section className="border-t border-border bg-surface py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-sm font-bold text-moons-navy">Popular searches</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <Link
              key={term}
              href={`/jobs?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-xs font-medium text-foreground transition hover:border-moons-blue hover:text-moons-blue"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EmployerBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div className="overflow-hidden rounded-xl border border-moons-blue/20 bg-gradient-to-r from-[#e8f0fa] via-[#dbeafe] to-[#c7d8f0] shadow-[0_8px_32px_rgba(74,127,212,0.12)]">
        <div className="grid md:grid-cols-5">
          <div className="relative min-h-[180px] md:col-span-2">
            <Image
              src={landingImages.employer}
              alt="Employers hiring"
              fill
              className="object-cover"
              sizes="400px"
            />
            <div className="absolute inset-0 bg-moons-navy/20 md:hidden" />
          </div>
          <div className="flex flex-col justify-center p-8 md:col-span-3">
            <p className="text-xs font-bold uppercase tracking-wider text-moons-blue">
              For employers
            </p>
            <h2 className="mt-2 text-xl font-bold text-moons-navy md:text-2xl">
              Hire talent on Moons — post jobs for free
            </h2>
            <p className="mt-2 text-sm text-moons-muted">
              Reach lakhs of active jobseekers. Manage applicants from one dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/register?role=recruiter"
                className="rounded bg-moons-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-moons-blue-dark"
              >
                Post a free job
              </Link>
              <Link
                href="/login?role=recruiter"
                className="rounded border border-moons-blue/40 bg-surface-elevated/80 px-6 py-2.5 text-sm font-semibold text-moons-navy hover:bg-surface-elevated"
              >
                Employer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
