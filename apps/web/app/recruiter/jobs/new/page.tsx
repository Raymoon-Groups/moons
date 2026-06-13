'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmploymentType, UserRole } from '@moons/shared';
import {
  experienceBandToYears,
  JobFormFields,
  type JobFormValues,
} from '@/components/job-form-fields';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';
import type { Profile } from '@/lib/types';

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

  if (profileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f0f3f8] text-sm text-moons-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-1 text-sm font-medium text-moons-blue hover:underline"
        >
          ← My posted jobs
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
                New listing
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-moons-navy md:text-3xl">
                Post a job
              </h1>
              <p className="mt-2 text-sm text-moons-muted">
                Create a public listing and start receiving applications from candidates.
              </p>
            </section>

            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-border bg-white p-6 shadow-sm"
            >
              <JobFormFields
                values={values}
                onChange={onChange}
                layout="sections"
                showProfileHint
              />

              {error && (
                <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/recruiter/jobs"
                  className="text-center text-sm font-semibold text-moons-muted transition hover:text-moons-navy"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-moons-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                >
                  {loading ? 'Publishing…' : 'Publish job'}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Quick links</h3>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/recruiter/jobs"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  My posted jobs
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-navy transition hover:border-moons-blue hover:bg-surface"
                >
                  Back to dashboard
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-moons-muted transition hover:border-moons-blue hover:text-moons-navy"
                >
                  Company profile
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-moons-navy">Posting tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-moons-muted">
                <li>Use a specific job title so candidates can find your role in search.</li>
                <li>
                  Company name is the hiring company on the listing — it can differ from your
                  MoonsJob employer profile.
                </li>
                <li>Add salary and experience details to attract the right applicants.</li>
                <li>Your listing goes live immediately after you publish.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
