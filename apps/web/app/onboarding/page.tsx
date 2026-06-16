'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, type AuthUser } from '@moons/shared';
import { INDUSTRY_OPTIONS } from '@/components/profile/profile-constants';
import { authUpload } from '@/lib/api-client';
import { parseResume } from '@/lib/resume-parser';
import { useAuth } from '@/lib/auth-context';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready, updateUser } = useAuth();

  /* ── candidate fields ── */
  const [fullName,  setFullName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [location,  setLocation]  = useState('');
  const [headline,  setHeadline]  = useState('');

  /* ── recruiter fields ── */
  const [companyName,    setCompanyName]    = useState('');
  const [designation,    setDesignation]    = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize,    setCompanySize]    = useState('');
  const [industry,       setIndustry]       = useState('');

  /* ── shared ── */
  const [resume,      setResume]      = useState<File | null>(null);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [parsing,     setParsing]     = useState(false);
  const [parseBanner, setParseBanner] = useState<'success' | 'partial' | 'error' | null>(null);
  const [parsedFields, setParsedFields] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRecruiter  = user?.role === UserRole.RECRUITER;

  useEffect(() => {
    if (ready && !user)                   { router.replace('/login');     return; }
    if (ready && user?.onboardingCompleted) router.replace('/dashboard');
  }, [ready, user, router]);

  /* ─── Parse resume in browser ─── */
  async function handleResumeChange(file: File | null) {
    setResume(file);
    setParseBanner(null);
    setParsedFields([]);
    if (!file) return;

    setParsing(true);
    try {
      const p = await parseResume(file);
      const filled: string[] = [];

      if (p.fullName && !fullName.trim())  { setFullName(p.fullName);   filled.push('Full name'); }
      if (p.phone    && !phone.trim())     { setPhone(p.phone);         filled.push('Phone'); }
      if (p.location && !location.trim())  { setLocation(p.location);   filled.push('Location'); }
      if (p.headline && !headline.trim())  { setHeadline(p.headline);   filled.push('Designation'); }

      setParsedFields(filled);
      setParseBanner(filled.length > 0 ? 'success' : 'partial');
    } catch (err) {
      console.error('[resume-parse]', err);
      setParseBanner('error');
    } finally {
      setParsing(false);
    }
  }

  /* ─── Submit ─── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    try {
      const fd = new FormData();

      if (isRecruiter) {
        fd.append('companyName',    companyName);
        fd.append('designation',    designation);
        fd.append('companyWebsite', companyWebsite);
        fd.append('companySize',    companySize);
        if (fullName.trim()) fd.append('fullName', fullName);
        if (industry.trim()) fd.append('industry', industry);
      } else {
        fd.append('fullName',  fullName);
        fd.append('phone',     phone);
        fd.append('location',  location);
        if (headline.trim()) fd.append('headline', headline);
        if (resume) fd.append('resume', resume);
      }

      const result = await authUpload<{ user: AuthUser }>('/auth/onboarding/complete', fd);
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
      <div className="flex min-h-screen items-center justify-center text-sm text-moons-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-elevated p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-moons-navy">Complete your profile</h1>
        <p className="mt-2 text-sm text-foreground">
          {isRecruiter
            ? 'Tell us about your company to get started as an employer.'
            : "Upload your resume and we'll auto-fill your details."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isRecruiter ? (
            <>
              <Field label="Company Name"    id="companyName"    value={companyName}    onChange={setCompanyName}    required />
              <Field label="Your Designation" id="designation"   value={designation}    onChange={setDesignation}    required />
              <Field label="Company Website"  id="companyWebsite" value={companyWebsite} onChange={setCompanyWebsite} required placeholder="https://example.com" />
              <Field label="Company Size"     id="companySize"   value={companySize}    onChange={setCompanySize}    required placeholder="e.g. 11-50 employees" />
              <div>
                <label htmlFor="industry" className="block text-sm font-bold text-moons-navy">Industry (optional)</label>
                <select
                  id="industry" value={industry} onChange={e => setIndustry(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-moons-blue focus:ring-1 focus:ring-moons-blue"
                >
                  <option value="">Select industry</option>
                  {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <Field label="Your Name (optional)" id="fullName" value={fullName} onChange={setFullName} />
            </>
          ) : (
            <>
              {/* ── Upload zone ── */}
              <div>
                <label className="block text-sm font-bold text-moons-navy">
                  Resume <span className="font-normal text-moons-muted">(PDF or Word · max 5 MB)</span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleResumeChange(e.dataTransfer.files?.[0] ?? null); }}
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                  role="button" tabIndex={0} aria-label="Upload resume"
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-4 py-6 text-center transition hover:border-moons-blue hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-moons-blue"
                >
                  {parsing ? (
                    <>
                      <ParseSpinner />
                      <p className="text-sm font-medium text-moons-blue">Reading your resume…</p>
                      <p className="text-xs text-moons-muted">Extracting your details, just a moment.</p>
                    </>
                  ) : resume ? (
                    <>
                      <ResumeIcon />
                      <p className="max-w-xs truncate text-sm font-medium text-moons-navy">{resume.name}</p>
                      <p className="text-xs text-moons-muted">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <UploadIcon />
                      <p className="text-sm font-medium text-moons-navy">Drop your resume here or click to browse</p>
                      <p className="text-xs text-moons-muted">We will auto-fill your details from it</p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef} type="file" required className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={e => handleResumeChange(e.target.files?.[0] ?? null)}
                />

                {/* ── Parse result banners ── */}
                {parseBanner === 'success' && (
                  <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    <p className="font-medium">✓ Resume read successfully!</p>
                    {parsedFields.length > 0 && (
                      <p className="mt-0.5 text-xs text-green-600">
                        Auto-filled: {parsedFields.join(', ')}. Review and edit below if needed.
                      </p>
                    )}
                  </div>
                )}
                {parseBanner === 'partial' && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    <p className="font-medium">Resume uploaded.</p>
                    <p className="mt-0.5 text-xs text-amber-600">
                      We could not extract all details automatically. Please fill in the fields below.
                    </p>
                  </div>
                )}
                {parseBanner === 'error' && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    Could not read the resume file. Please fill in the details below manually.
                  </p>
                )}
              </div>

              {/* ── Auto-filled fields ── */}
              <Field label="Full Name"                   id="fullName"  value={fullName}  onChange={setFullName}  required />
              <Field label="Phone Number"                id="phone"     value={phone}     onChange={setPhone}     required />
              <Field label="Location"                    id="location"  value={location}  onChange={setLocation}  required placeholder="City, Country" />
              <Field label="Current designation (optional)" id="headline" value={headline} onChange={setHeadline} placeholder="Software Engineer, UX Designer…" />
            </>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit" disabled={loading || parsing}
            className="w-full rounded-full bg-moons-blue py-3.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
          >
            {loading ? 'Saving…' : parsing ? 'Reading resume…' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Shared UI pieces ────────────────────────────────────────────────────────

function Field({ label, id, value, onChange, required, placeholder }: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-moons-navy">{label}</label>
      <input
        id={id} type="text" required={required} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:ring-1 focus:ring-moons-blue"
      />
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="h-8 w-8 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg className="h-8 w-8 text-moons-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ParseSpinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-moons-blue" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
