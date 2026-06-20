'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveAssetUrl } from '@/lib/assets';
import { apiFetch } from '@/lib/api-client';
import type { TopCompany } from '@/lib/jobs';

export function TopCompaniesSection() {
  const [companies, setCompanies] = useState<TopCompany[]>([]);

  useEffect(() => {
    apiFetch<TopCompany[]>('/jobs/companies/top')
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  if (companies.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-center text-lg font-bold text-heading md:text-xl">
        Top companies hiring now
      </h2>
      <p className="mt-1 text-center text-sm text-moons-muted">
        Explore openings at leading employers on Moons
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {companies.map((co) => {
          const logo = co.companyLogoUrl ? resolveAssetUrl(co.companyLogoUrl) : null;
          return (
            <Link
              key={co.recruiterId}
              href={`/companies/${co.recruiterId}`}
              className="group rounded-lg border border-border bg-surface-elevated p-4 shadow-sm transition hover:border-moons-blue hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface text-lg font-bold text-moons-muted">
                {logo ? (
                  <img src={logo} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  co.companyName.charAt(0)
                )}
              </div>
              <p className="mt-3 font-semibold text-heading group-hover:text-moons-blue">
                {co.companyName}
              </p>
              <p className="mt-1 text-xs text-moons-muted">
                {co.openJobs} open job{co.openJobs === 1 ? '' : 's'}
                {co.location ? ` · ${co.location}` : ''}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
