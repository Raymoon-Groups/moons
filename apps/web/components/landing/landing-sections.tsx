import Image from 'next/image';
import Link from 'next/link';
import { JobCard } from '@/components/landing/job-card';
import {
  careerServices,
  categories,
  landingImages,
  mockJobs,
  popularLocations,
  popularSearches,
  stats,
  topCompanies,
} from '@/lib/landing-data';

export function StatsBar() {
  return (
    <section className="relative z-10 mx-auto -mt-4 max-w-5xl px-4">
      <div className="grid grid-cols-2 divide-x divide-slate-100 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-5 text-center">
            <p className="text-xl font-extrabold text-moons-blue md:text-2xl">{stat.value}</p>
            <p className="mt-0.5 text-xs font-medium text-moons-muted">{stat.label}</p>
          </div>
        ))}
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
            className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-moons-blue hover:shadow-md"
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
    <section className="border-y border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-moons-navy md:text-xl">
            Trending jobs on Moons
          </h2>
          <Link href="/jobs" className="text-sm font-semibold text-moons-blue hover:underline">
            View all jobs →
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
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

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {topCompanies.map((co) => (
          <Link
            key={co.name}
            href={`/jobs?q=${encodeURIComponent(co.name)}`}
            className="group flex flex-col items-center rounded-lg border border-slate-200 bg-white p-3 transition hover:border-moons-blue hover:shadow-sm"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-md ring-1 ring-slate-100">
              <Image src={co.logo} alt={co.name} fill className="object-cover" sizes="40px" />
            </div>
            <span className="mt-2 text-xs font-semibold text-slate-700 group-hover:text-moons-blue">
              {co.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function JobsByCity() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-lg font-bold text-moons-navy md:text-xl">
          Jobs by city
        </h2>
        <p className="mt-1 text-sm text-moons-muted">
          Find opportunities in top metro cities
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {popularLocations.map((loc) => (
            <Link
              key={loc.city}
              href={`/jobs?location=${encodeURIComponent(loc.city)}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-slate-200"
            >
              <Image
                src={loc.image}
                alt={loc.city}
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="180px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 w-full p-3">
                <p className="text-sm font-bold text-white">{loc.city}</p>
                <p className="text-[11px] text-white/80">{loc.jobs} jobs</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CareerServices() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-lg font-bold text-moons-navy md:text-xl">
        Career services on Moons
      </h2>
      <p className="mt-1 text-sm text-moons-muted">Free tools to help you get hired faster</p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {careerServices.map((service) => (
          <Link
            key={service.title}
            href={service.href}
            className="group flex flex-col items-center rounded-lg border border-slate-200 bg-white p-4 text-center transition hover:border-moons-blue hover:shadow-md"
          >
            <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-blue-100">
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <p className="mt-3 text-sm font-bold text-moons-navy group-hover:text-moons-blue">
              {service.title}
            </p>
            <p className="mt-0.5 text-xs text-moons-muted">{service.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PopularSearchTags() {
  return (
    <section className="border-t border-slate-200 bg-[#f4f6f9] py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-sm font-bold text-moons-navy">Popular searches</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <Link
              key={term}
              href={`/jobs?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-moons-blue hover:text-moons-blue"
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
      <div className="overflow-hidden rounded-xl bg-moons-navy shadow-lg">
        <div className="grid md:grid-cols-5">
          <div className="relative min-h-[180px] md:col-span-2">
            <Image
              src={landingImages.employer}
              alt="Employers hiring"
              fill
              className="object-cover"
              sizes="400px"
            />
            <div className="absolute inset-0 bg-moons-navy/40 md:hidden" />
          </div>
          <div className="flex flex-col justify-center p-8 md:col-span-3">
            <p className="text-xs font-bold uppercase tracking-wider text-moons-orange">
              For employers
            </p>
            <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">
              Hire talent on Moons — post jobs for free
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Reach lakhs of active jobseekers. Manage applicants from one dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/register?role=recruiter"
                className="rounded bg-moons-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-moons-orange-dark"
              >
                Post a free job
              </Link>
              <Link
                href="/login?role=recruiter"
                className="rounded border border-slate-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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
