'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmploymentType, UserRole } from '@moons/shared';
import { authFetch } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth';
import type { JobListing } from '@/lib/jobs';

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    EmploymentType.FULL_TIME,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
    } else if (user.role !== UserRole.RECRUITER) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authFetch<JobListing>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          companyName,
          description,
          location,
          employmentType,
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
      <Link href="/dashboard" className="text-sm text-moons-blue hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-xl font-bold text-moons-navy">Post a new job</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">Job title *</label>
          <input
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-moons-blue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Company name *</label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-moons-blue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Location *</label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-moons-blue"
            placeholder="Bangalore · Hybrid"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Employment type *</label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-moons-blue"
          >
            {Object.values(EmploymentType).map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Description * (min 20 chars)
          </label>
          <textarea
            required
            minLength={20}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-moons-blue"
            placeholder="Describe the role, responsibilities, and requirements…"
          />
        </div>

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
