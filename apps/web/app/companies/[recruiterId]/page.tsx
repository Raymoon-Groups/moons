'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CompanyProfileCard } from '@/components/company-profile-card';
import { apiFetch } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import type { PublicCompanyProfile } from '@/lib/jobs';

export default function CompanyPage() {
  const params = useParams();
  const recruiterId = params.recruiterId as string;
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<PublicCompanyProfile>(`/profiles/companies/${recruiterId}`)
      .then(setCompany)
      .catch((err) => setError(err instanceof Error ? err.message : 'Company not found'))
      .finally(() => setLoading(false));
  }, [recruiterId]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-moons-muted">Loading company…</div>;
  }

  if (error || !company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-red-600">{error || 'Company not found'}</p>
        <Link href="/companies" className="mt-4 inline-block text-sm text-moons-blue hover:underline">
          ← Browse companies
        </Link>
      </div>
    );
  }

  const logoSrc = company.companyLogoUrl ? resolveAssetUrl(company.companyLogoUrl) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface-elevated">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/companies" className="text-xs text-moons-blue hover:underline">← Back to companies</Link>
          <div className="mt-4 flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface text-xl font-bold text-moons-muted">
                  {(company.companyName ?? 'C').charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-heading">{company.companyName}</h1>
              <p className="text-sm text-moons-muted">
                {company.openJobsCount} open job{company.openJobsCount === 1 ? '' : 's'}
                {company.industry ? ` · ${company.industry}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <CompanyProfileCard
          job={{
            companyName: company.companyName ?? 'Company',
            companyLogoUrl: company.companyLogoUrl,
            industry: company.industry,
            companyType: company.companyType,
            companyWebsite: company.companyWebsite,
            companySize: company.companySize,
            companyLocation: company.companyLocation,
            officeAddress: company.officeAddress,
            companySummary: company.companySummary,
          }}
        />

        <section className="rounded-lg border border-border bg-surface-elevated shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-heading">Open positions</h2>
          </div>
          <div className="divide-y divide-border">
            {company.openJobs.length === 0 && (
              <p className="p-5 text-sm text-moons-muted">No open positions right now.</p>
            )}
            {company.openJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block p-5 hover:bg-surface-hover/40"
              >
                <p className="font-semibold text-heading">{job.title}</p>
                <p className="mt-1 text-sm text-moons-muted">
                  {job.location} · {job.employmentType.replace('_', ' ')}
                  {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
