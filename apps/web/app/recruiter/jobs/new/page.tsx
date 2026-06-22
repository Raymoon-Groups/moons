'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmploymentType, UserRole } from '@moons/shared';
import {
  DashBackLink,
  DashContentCard,
  DashErrorBanner,
  DashLoadingPage,
  DashPageHero,
  DashPageLayout,
  DashQuickLinks,
  DashSidebarPanel,
  DashTipsList,
} from '@/components/dash/dash-page-shell';
import {
  experienceBandToYears,
  JobFormFields,
  type JobFormValues,
} from '@/components/job-form-fields';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';
import type { Profile } from '@/lib/types';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const [values, setValues] = useState<JobFormValues>({
    title: '',
    companyName: '',
    description: '',
    location: '',
    employmentType: EmploymentType.FULL_TIME,
    salaryRange: '',
    experienceBand: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.RECRUITER) {
      router.replace('/dashboard');
      return;
    }

    authFetch<Profile>('/profiles/me')
      .then((profile) => {
        setValues((v) => ({
          ...v,
          companyName: profile.currentCompany ?? v.companyName,
          location: profile.location ?? v.location,
        }));
      })
      .catch(() => undefined)
      .finally(() => setProfileLoading(false));
  }, [router]);

  function onChange<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const exp = experienceBandToYears(values.experienceBand);
    try {
      const job = await authFetch<JobListing>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: values.title,
          companyName: values.companyName,
          description: values.description,
          location: values.location,
          employmentType: values.employmentType,
          salaryRange: values.salaryRange || undefined,
          ...exp,
        }),
      });
      router.push(`/recruiter/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setLoading(false);
    }
  }

  if (profileLoading) return <DashLoadingPage message="Loading…" />;

  return (
    <DashPageLayout
      backLink={<DashBackLink href="/recruiter/jobs">← My posted jobs</DashBackLink>}
      sidebar={
        <>
          <DashSidebarPanel title="Quick links">
            <DashQuickLinks
              links={[
                { href: '/recruiter/jobs', label: 'My posted jobs' },
                { href: '/dashboard', label: 'Back to dashboard' },
                { href: '/profile', label: 'Company profile' },
              ]}
            />
          </DashSidebarPanel>
          <DashTipsList
            title="Posting tips"
            items={[
              'Use a specific job title so candidates can find your role in search.',
              'Company name is the hiring company on the listing — it can differ from your MoonsJob employer profile.',
              'Add salary and experience details to attract the right applicants.',
              'Your listing goes live immediately after you publish.',
            ]}
          />
        </>
      }
    >
      <DashPageHero
        eyebrow="New listing"
        eyebrowIcon={<PlusIcon className="h-3.5 w-3.5" />}
        title="Post a job"
        subtitle="Create a public listing and start receiving applications from candidates."
      />

      <form onSubmit={handleSubmit} className="dash-content-card">
        <JobFormFields values={values} onChange={onChange} layout="sections" showProfileHint />

        {error ? <div className="mt-6"><DashErrorBanner message={error} /></div> : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/recruiter/jobs"
            className="text-center text-sm font-semibold text-moons-muted transition hover:text-heading"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md disabled:opacity-60"
          >
            {loading ? 'Publishing…' : 'Publish job'}
          </button>
        </div>
      </form>
    </DashPageLayout>
  );
}
