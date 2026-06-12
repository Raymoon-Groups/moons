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
      .catch(() => undefined);
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
      await authFetch<JobListing>('/jobs', {
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
      router.push('/recruiter/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/recruiter/jobs" className="text-sm text-moons-blue hover:underline">
        ← My jobs
      </Link>
      <h1 className="mt-4 text-xl font-bold text-moons-navy">Post a new job</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-border bg-surface-elevated p-6 shadow-sm">
        <JobFormFields values={values} onChange={onChange} showProfileHint />
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-moons-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-moons-orange-dark disabled:opacity-60"
        >
          {loading ? 'Publishing…' : 'Publish job'}
        </button>
      </form>
    </div>
  );
}
