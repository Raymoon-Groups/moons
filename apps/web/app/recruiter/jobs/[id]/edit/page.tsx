'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { EmploymentType, UserRole } from '@moons/shared';
import {
  experienceBandToYears,
  JobFormFields,
  yearsToExperienceBand,
  type JobFormValues,
} from '@/components/job-form-fields';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';

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

  if (initialLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f0f3f8] text-sm text-moons-muted">
        Loading job…
      </div>
    );
  }

  if (!values && error) {
    return (
      <div className="min-h-[50vh] bg-[#f0f3f8] px-4 py-10">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <Link
            href="/recruiter/jobs"
            className="mt-4 inline-block text-sm font-semibold text-moons-blue hover:underline"
          >
            ← Back to my jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href={`/recruiter/jobs/${jobId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-moons-blue hover:underline"
        >
          ← Back to job
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
                Edit listing
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-moons-navy md:text-3xl">
                {jobTitle || 'Edit job'}
              </h1>
              <p className="mt-2 text-sm text-moons-muted">
                Update the details candidates see on your public job listing.
              </p>
            </section>

            {values && (
              <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-border bg-white p-6 shadow-sm"
              >
                <JobFormFields values={values} onChange={onChange} layout="sections" />

                {error && (
                  <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={`/recruiter/jobs/${jobId}`}
                    className="text-center text-sm font-semibold text-moons-muted transition hover:text-moons-navy"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                  >
                    {loading ? 'Saving changes…' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Quick links</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/recruiter/jobs/${jobId}`}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  View job
                </Link>
                <Link
                  href={`/recruiter/jobs/${jobId}/applicants`}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  View applicants
                </Link>
                <Link
                  href={`/jobs?job=${jobId}`}
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-moons-navy"
                >
                  Preview public listing
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Editing tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li>Use a clear job title that matches what candidates search for.</li>
                <li>
                  Company name is the hiring company shown on the listing, not necessarily your
                  MoonsJob profile name.
                </li>
                <li>Changes are saved to your live listing once you click Save changes.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
