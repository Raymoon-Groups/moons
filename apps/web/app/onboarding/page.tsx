'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, type AuthUser } from '@moons/shared';
import { INDUSTRY_OPTIONS } from '@/components/profile/profile-constants';
import { authUpload } from '@/lib/api-client';
import { INDIAN_CITY_OPTIONS } from '@/lib/location-suggestions';
import { parseResume } from '@/lib/resume-parser';
import { useAuth } from '@/lib/auth-context';

const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

const selectClass =
  'mt-2.5 w-full rounded-2xl border border-[#D7E0EC] bg-[#F8FAFC] px-4 py-3.5 text-[15px] text-foreground outline-none transition focus:border-moons-blue focus:bg-white focus:ring-2 focus:ring-moons-blue/15';
const inputClass =
  'mt-2.5 w-full rounded-2xl border border-[#D7E0EC] bg-[#F8FAFC] px-4 py-3.5 text-[15px] text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:bg-white focus:ring-2 focus:ring-moons-blue/15';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready, updateUser } = useAuth();

  /* ── candidate fields ── */
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');

  /* ── recruiter fields ── */
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');

  /* ── shared ── */
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseBanner, setParseBanner] = useState<'success' | 'partial' | 'error' | null>(null);
  const [parsedFields, setParsedFields] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRecruiter = user?.role === UserRole.RECRUITER;

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
      return;
    }
    if (ready && user?.onboardingCompleted) router.replace('/dashboard');
  }, [ready, user, router]);

  async function handleResumeChange(file: File | null) {
    setResume(file);
    setParseBanner(null);
    setParsedFields([]);
    if (!file) return;

    setParsing(true);
    try {
      const p = await parseResume(file);
      const filled: string[] = [];

      if (p.fullName && !fullName.trim()) {
        setFullName(p.fullName);
        filled.push('Full name');
      }
      if (p.phone && !phone.trim()) {
        const digits = p.phone.replace(/\D/g, '');
        const ten = digits.length > 10 ? digits.slice(-10) : digits;
        if (ten.length === 10) {
          setPhone(ten);
          filled.push('Phone');
        }
      }
      if (p.location && !location.trim()) {
        const matched = INDIAN_CITY_OPTIONS.find(
          (city) =>
            city.toLowerCase() === p.location!.toLowerCase() ||
            p.location!.toLowerCase().includes(city.toLowerCase()),
        );
        if (matched) {
          setLocation(matched);
          filled.push('Location');
        }
      }
      if (p.headline && !headline.trim()) {
        setHeadline(p.headline);
        filled.push('Designation');
      }

      setParsedFields(filled);
      setParseBanner(filled.length > 0 ? 'success' : 'partial');
    } catch (err) {
      console.error('[resume-parse]', err);
      setParseBanner('error');
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (!location.trim()) {
      setError('Please select your city');
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();

      if (isRecruiter) {
        fd.append('companyName', companyName);
        fd.append('designation', designation);
        fd.append('companyWebsite', companyWebsite);
        fd.append('companySize', companySize);
        fd.append('phone', phone.replace(/\D/g, ''));
        fd.append('location', location);
        if (fullName.trim()) fd.append('fullName', fullName);
        if (industry.trim()) fd.append('industry', industry);
      } else {
        fd.append('fullName', fullName);
        fd.append('phone', phone.replace(/\D/g, ''));
        fd.append('location', location);
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
    <div className="relative min-h-dvh bg-[#EEF3F9]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 0% 0%, rgba(74,127,212,0.14), transparent 50%), radial-gradient(ellipse 60% 45% at 100% 100%, rgba(74,127,212,0.08), transparent 55%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div className="w-full overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(26,39,68,0.1)]">
          <div className="grid min-h-[640px] lg:grid-cols-[1.05fr_1.2fr]">
              {/* ── Left panel (light) ── */}
              <aside className="relative flex flex-col justify-between border-b border-[#E4EAF2] bg-[#F7FAFD] p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12 xl:p-14">
                <div>
                  <span className="inline-flex rounded-full bg-moons-blue/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-moons-blue">
                    {isRecruiter ? 'Employer setup' : 'Jobseeker setup'}
                  </span>
                  <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-heading sm:text-4xl">
                    Complete your profile
                  </h1>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-moons-muted">
                    {isRecruiter
                      ? 'Add your company details so candidates can find and trust your openings.'
                      : 'Upload your resume and we’ll auto-fill your details — then you’re ready to apply.'}
                  </p>
                </div>

                {!isRecruiter ? (
                  <div className="mt-10">
                    <label className="mb-3 block text-sm font-semibold text-heading">
                      Resume{' '}
                      <span className="font-normal text-moons-muted">
                        (optional · PDF or Word · max 5 MB)
                      </span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleResumeChange(e.dataTransfer.files?.[0] ?? null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      aria-label="Upload resume"
                      className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#C9D6E8] bg-white px-6 py-10 text-center transition hover:border-moons-blue hover:bg-moons-blue/[0.03] focus:outline-none focus:ring-2 focus:ring-moons-blue/25"
                    >
                      {parsing ? (
                        <>
                          <ParseSpinner />
                          <p className="text-base font-semibold text-moons-blue">Reading your resume…</p>
                          <p className="text-sm text-moons-muted">Extracting details, just a moment.</p>
                        </>
                      ) : resume ? (
                        <>
                          <ResumeIcon />
                          <p className="max-w-[280px] truncate text-base font-semibold text-heading">
                            {resume.name}
                          </p>
                          <p className="text-sm text-moons-muted">Click to replace</p>
                        </>
                      ) : (
                        <>
                          <UploadIcon />
                          <p className="text-base font-semibold text-heading">
                            Drop resume here or{' '}
                            <span className="text-moons-blue underline decoration-moons-blue/30 underline-offset-2">
                              browse
                            </span>
                          </p>
                          <p className="text-sm text-moons-muted">We’ll auto-fill your details from it</p>
                        </>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => handleResumeChange(e.target.files?.[0] ?? null)}
                    />

                    {parseBanner === 'success' && (
                      <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
                        <p className="font-semibold">Resume read successfully</p>
                        {parsedFields.length > 0 && (
                          <p className="mt-1 text-sm text-emerald-600">
                            Auto-filled: {parsedFields.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                    {parseBanner === 'partial' && (
                      <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
                        <p className="font-semibold">Resume uploaded</p>
                        <p className="mt-1 text-sm text-amber-700">
                          Couldn’t extract everything — fill the fields on the right.
                        </p>
                      </div>
                    )}
                    {parseBanner === 'error' && (
                      <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                        Couldn’t read the file. Please fill details manually.
                      </div>
                    )}
                  </div>
                ) : (
                  <ul className="mt-12 space-y-4">
                    {[
                      'Post jobs in minutes',
                      'Review applicants in one place',
                      'Build your employer brand',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-[#E4EAF2] bg-white px-4 py-3.5 text-sm font-medium text-heading"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moons-blue/10 text-sm text-moons-blue">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </aside>

              {/* ── Right panel: form ── */}
              <div className="flex flex-col justify-center bg-white p-8 sm:p-10 lg:p-12 xl:p-14">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-heading sm:text-[28px]">
                    {isRecruiter ? 'Company details' : 'Your details'}
                  </h2>
                  <p className="mt-2 text-base text-moons-muted">
                    {isRecruiter
                      ? 'These appear on your company profile and job posts.'
                      : 'Review auto-filled fields and edit anything that looks off.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">
                  {isRecruiter ? (
                    <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6">
                      <Field
                        label="Company Name"
                        id="companyName"
                        value={companyName}
                        onChange={setCompanyName}
                        required
                      />
                      <Field
                        label="Your Designation"
                        id="designation"
                        value={designation}
                        onChange={setDesignation}
                        required
                      />
                      <Field
                        label="Company Website"
                        id="companyWebsite"
                        value={companyWebsite}
                        onChange={setCompanyWebsite}
                        required
                        placeholder="https://example.com"
                      />
                      <div>
                        <label htmlFor="companySize" className="block text-sm font-semibold text-heading">
                          Company Size
                        </label>
                        <select
                          id="companySize"
                          required
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Select company size</option>
                          {COMPANY_SIZE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-heading">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          required
                          maxLength={10}
                          pattern="[0-9]{10}"
                          title="Enter a 10-digit mobile number"
                          value={phone}
                          placeholder="10-digit mobile number"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(digits);
                          }}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="location" className="block text-sm font-semibold text-heading">
                          Office city
                        </label>
                        <select
                          id="location"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Select city</option>
                          {INDIAN_CITY_OPTIONS.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="industry" className="block text-sm font-semibold text-heading">
                          Industry <span className="font-normal text-moons-muted">(optional)</span>
                        </label>
                        <select
                          id="industry"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Select industry</option>
                          {INDUSTRY_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Field
                        label="Your Name (optional)"
                        id="fullName"
                        value={fullName}
                        onChange={setFullName}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6">
                      <Field
                        label="Full Name"
                        id="fullName"
                        value={fullName}
                        onChange={setFullName}
                        required
                      />
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-heading">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          required
                          maxLength={10}
                          pattern="[0-9]{10}"
                          title="Enter a 10-digit mobile number"
                          value={phone}
                          placeholder="10-digit mobile number"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(digits);
                          }}
                          className="mt-2.5 w-full rounded-2xl border border-[#D7E0EC] bg-[#F8FAFC] px-4 py-3.5 text-[15px] text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:bg-white focus:ring-2 focus:ring-moons-blue/15"
                        />
                      </div>
                      <div>
                        <label htmlFor="location" className="block text-sm font-semibold text-heading">
                          Location
                        </label>
                        <select
                          id="location"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="mt-2.5 w-full rounded-2xl border border-[#D7E0EC] bg-[#F8FAFC] px-4 py-3.5 text-[15px] text-foreground outline-none transition focus:border-moons-blue focus:bg-white focus:ring-2 focus:ring-moons-blue/15"
                        >
                          <option value="">Select city</option>
                          {INDIAN_CITY_OPTIONS.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Field
                        label="Current designation"
                        id="headline"
                        value={headline}
                        onChange={setHeadline}
                        placeholder="Software Engineer, UX Designer…"
                        optional
                      />
                    </div>
                  )}

                  {error && (
                    <p className="rounded-2xl bg-red-50 px-4 py-3.5 text-sm text-red-600">{error}</p>
                  )}

                  <div className="pt-2">
                    <p className="mb-4 text-sm text-moons-muted">
                      You can update everything later from Profile.
                    </p>
                    <button
                      type="submit"
                      disabled={loading || parsing}
                      className="w-full rounded-xl bg-moons-blue py-3.5 text-[15px] font-semibold text-white transition hover:bg-moons-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading
                        ? 'Saving…'
                        : parsing
                          ? 'Reading resume…'
                          : 'Continue to Dashboard'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
  optional,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-heading">
        {label}
        {optional ? <span className="font-normal text-moons-muted"> (optional)</span> : null}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2.5 w-full rounded-2xl border border-[#D7E0EC] bg-[#F8FAFC] px-4 py-3.5 text-[15px] text-foreground outline-none transition placeholder:text-moons-muted focus:border-moons-blue focus:bg-white focus:ring-2 focus:ring-moons-blue/15"
      />
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="h-10 w-10 text-moons-blue/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg className="h-10 w-10 text-moons-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function ParseSpinner() {
  return (
    <svg className="h-10 w-10 animate-spin text-moons-blue" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
