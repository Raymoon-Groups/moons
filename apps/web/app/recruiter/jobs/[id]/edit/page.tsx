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
import { apiFetch, authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [values, setValues] = useState<JobFormValues | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    apiFetch<JobListing>(`/jobs/${jobId}`)
      .then((job) => {
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job'));
  }, [jobId]);

  function onChange<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((v) => (v ? { ...v, [key]: value } : v));
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
      router.push('/recruiter/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setLoading(false);
    }
  }

  if (!values && !error) {
    return <div className="p-8 text-center text-sm text-moons-muted">Loading job…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/recruiter/jobs" className="text-sm text-moons-blue hover:underline">
        ← My jobs
      </Link>
      <h1 className="mt-4 text-xl font-bold text-moons-navy">Edit job</h1>

      {values && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-border bg-surface-elevated p-6 shadow-sm">
          <JobFormFields values={values} onChange={onChange} />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-moons-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-moons-orange-dark disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
      {!values && error && <p className="mt-6 text-sm text-red-600">{error}</p>}
    </div>
  );
}
