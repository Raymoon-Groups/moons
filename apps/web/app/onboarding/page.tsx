'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, type AuthUser } from '@moons/shared';
import { authUpload } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready, updateUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRecruiter = user?.role === UserRole.RECRUITER;

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
      return;
    }
    if (ready && user?.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [ready, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();

      if (isRecruiter) {
        formData.append('companyName', companyName);
        formData.append('designation', designation);
        formData.append('companyWebsite', companyWebsite);
        formData.append('companySize', companySize);
        if (fullName.trim()) formData.append('fullName', fullName);
      } else {
        formData.append('fullName', fullName);
        formData.append('phone', phone);
        formData.append('location', location);
        if (resume) formData.append('resume', resume);
      }

      const result = await authUpload<{ user: AuthUser }>(
        '/auth/onboarding/complete',
        formData,
      );
      updateUser(result.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-moons-navy">Complete your profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isRecruiter
            ? 'Tell us about your company to get started as an employer.'
            : 'Add a few details so recruiters can find you.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isRecruiter ? (
            <>
              <Field label="Company Name" id="companyName" value={companyName} onChange={setCompanyName} required />
              <Field label="Your Designation" id="designation" value={designation} onChange={setDesignation} required />
              <Field label="Company Website" id="companyWebsite" value={companyWebsite} onChange={setCompanyWebsite} required placeholder="https://example.com" />
              <Field label="Company Size" id="companySize" value={companySize} onChange={setCompanySize} required placeholder="e.g. 11-50 employees" />
              <Field label="Your Name (optional)" id="fullName" value={fullName} onChange={setFullName} />
            </>
          ) : (
            <>
              <Field label="Full Name" id="fullName" value={fullName} onChange={setFullName} required />
              <Field label="Phone Number" id="phone" value={phone} onChange={setPhone} required />
              <Field label="Location" id="location" value={location} onChange={setLocation} required placeholder="City, Country" />
              <div>
                <label htmlFor="resume" className="block text-sm font-bold text-moons-navy">
                  Resume
                </label>
                <input
                  id="resume"
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
                <p className="mt-1 text-xs text-slate-500">PDF or Word, max 5 MB</p>
              </div>
            </>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-moons-navy py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-moons-navy">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-moons-navy focus:ring-1 focus:ring-moons-navy"
      />
    </div>
  );
}
