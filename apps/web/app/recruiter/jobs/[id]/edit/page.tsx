'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { EmploymentType, UserRole } from '@moons/shared';
import {
  DashBackLink,
  DashErrorBanner,
  DashErrorCard,
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
  yearsToExperienceBand,
  type JobFormValues,
} from '@/components/job-form-fields';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import { isDescriptionValid } from '@/lib/rich-text';
import type { JobListing } from '@/lib/jobs';

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [values, setValues] = useState<JobFormValues | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.RECRUITER) {
      router.replace('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    authFetch<JobListing>(`/jobs/mine/${jobId}`)
      .then((job) => {
        setJobTitle(job.title);
        setValues({
          title: job.title,
          companyName: job.companyName,
          description: job.description,
          location: job.location,
          employmentType: job.employmentType as EmploymentType,
          salaryRange: job.salaryRange ?? '',
          experienceBand: yearsToExperienceBand(job.minExperienceYears, job.maxExperienceYears),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job'))
      .finally(() => setInitialLoading(false));
  }, [jobId]);

  function onChange<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((v) => (v ? { ...v, [key]: value } : v));
    if (key === 'title' && typeof value === 'string') {
      setJobTitle(value);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values) return;
    setError('');
    if (!isDescriptionValid(values.description, 20)) {
      setError('Job description must be at least 20 characters.');
      return;
    }
    setLoading(true);
    const exp = experienceBandToYears(values.experienceBand);
    try {
      await authFetch<JobListing>(`/jobs/${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: values.title,
          companyName: values.companyName,
          description: values.description,
          location: values.location,
          employmentType: values.employmentType,
          salaryRange: values.salaryRange || null,
          minExperienceYears: exp.minExperienceYears ?? null,
          maxExperienceYears: exp.maxExperienceYears ?? null,
        }),
      });
      router.push(`/recruiter/jobs/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) return <DashLoadingPage message="Loading job…" />;

  if (!values && error) {
    return (
      <DashErrorCard message={error} backHref="/recruiter/jobs" backLabel="← Back to my jobs" />
    );
  }

  return (
    <DashPageLayout
      backLink={<DashBackLink href={`/recruiter/jobs/${jobId}`}>← Back to job</DashBackLink>}
      sidebar={
        <>
          <DashSidebarPanel title="Quick links">
            <DashQuickLinks
              links={[
                { href: `/recruiter/jobs/${jobId}`, label: 'View job' },
                { href: `/recruiter/jobs/${jobId}/applicants`, label: 'View applicants' },
                { href: `/jobs?job=${jobId}`, label: 'Preview public listing' },
              ]}
            />
          </DashSidebarPanel>
          <DashTipsList
            title="Editing tips"
            items={[
              'Use a clear job title that matches what candidates search for.',
              'Company name is the hiring company shown on the listing, not necessarily your MoonsJob profile name.',
              'Changes are saved to your live listing once you click Save changes.',
            ]}
          />
        </>
      }
    >
      <DashPageHero
        eyebrow="Edit listing"
        eyebrowIcon={<EditIcon className="h-3.5 w-3.5" />}
        title={jobTitle || 'Edit job'}
        subtitle="Update the details candidates see on your public job listing."
      />

      {values && (
        <form onSubmit={handleSubmit} className="dash-content-card">
          <JobFormFields values={values} onChange={onChange} layout="sections" />

          {error ? <div className="mt-6"><DashErrorBanner message={error} /></div> : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/recruiter/jobs/${jobId}`}
              className="text-center text-sm font-semibold text-moons-muted transition hover:text-heading"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue-dark hover:shadow-md disabled:opacity-60"
            >
              {loading ? 'Saving changes…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </DashPageLayout>
  );
}
