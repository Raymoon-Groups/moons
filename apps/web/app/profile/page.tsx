'use client';

import Link from 'next/link';
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { ImageLightbox } from '@/components/image-lightbox';
import { SuccessModal } from '@/components/success-modal';
import { authDelete, authFetch, authUpload } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import type { Profile } from '@/lib/types';

const NOTICE_OPTIONS = [
  'Immediately',
  '15 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  '6 Months',
  'Serving Notice Period',
];

const EXPERIENCE_OPTIONS = [
  { label: 'Fresher', value: 0 },
  ...Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1} year${i === 0 ? '' : 's'}`,
    value: i + 1,
  })),
  { label: '30+ years', value: 31 },
];

const SECTIONS = [
  { id: 'personal', label: 'Personal details' },
  { id: 'career', label: 'Career profile' },
  { id: 'skills', label: 'Key skills' },
  { id: 'summary', label: 'Profile summary' },
] as const;

function applyProfileToForm(data: Profile, setters: {
  setFullName: (v: string) => void;
  setPhone: (v: string) => void;
  setHeadline: (v: string) => void;
  setCurrentCompany: (v: string) => void;
  setExperienceYears: (v: string) => void;
  setLocation: (v: string) => void;
  setNoticePeriod: (v: string) => void;
  setSummary: (v: string) => void;
  setSkills: (v: string[]) => void;
}) {
  setters.setFullName(data.fullName ?? '');
  setters.setPhone(data.phone ?? '');
  setters.setHeadline(data.headline ?? '');
  setters.setCurrentCompany(data.currentCompany ?? '');
  setters.setExperienceYears(
    data.experienceYears !== null && data.experienceYears !== undefined
      ? String(data.experienceYears)
      : '',
  );
  setters.setLocation(data.location ?? '');
  setters.setNoticePeriod(data.noticePeriod ?? '');
  setters.setSummary(data.summary ?? '');
  setters.setSkills(data.skills ?? []);
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, syncUserFromProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [experienceYears, setExperienceYears] = useState<string>('');
  const [location, setLocation] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('personal');

  const clearPhotoPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPendingPhotoPreview(null);
  }, []);

  const loadProfile = useCallback(async () => {
    const data = await authFetch<Profile>('/profiles/me');
    setProfile(data);
    applyProfileToForm(data, {
      setFullName,
      setPhone,
      setHeadline,
      setCurrentCompany,
      setExperienceYears,
      setLocation,
      setNoticePeriod,
      setSummary,
      setSkills,
    });
    clearPhotoPreview();
    setPendingPhoto(null);
    setPendingRemovePhoto(false);
    return data;
  }, [clearPhotoPreview]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
      return;
    }
    if (!user) return;

    loadProfile()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router, ready, user, loadProfile]);

  function addSkill(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSkills((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  function handlePhotoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2 MB or smaller');
      return;
    }
    setError('');
    clearPhotoPreview();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPendingPhoto(file);
    setPendingPhotoPreview(previewUrl);
    setPendingRemovePhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemovePhoto() {
    clearPhotoPreview();
    setPendingPhoto(null);
    setPendingRemovePhoto(true);
    setError('');
  }

  function cancelPhotoChanges() {
    clearPhotoPreview();
    setPendingPhoto(null);
    setPendingRemovePhoto(false);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await authFetch<Profile>('/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          phone,
          headline,
          currentCompany,
          experienceYears:
            experienceYears === '' ? null : Number(experienceYears),
          location,
          noticePeriod,
          summary,
          skills,
        }),
      });

      if (pendingRemovePhoto) {
        await authDelete<Profile>('/profiles/me/avatar');
      } else if (pendingPhoto) {
        const formData = new FormData();
        formData.append('avatar', pendingPhoto);
        await authUpload<Profile>('/profiles/me/avatar', formData);
      }

      const saved = await loadProfile();
      syncUserFromProfile(saved);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading profile…</div>;
  }

  const savedAvatarUrl = profile?.avatarUrl
    ? `${resolveAssetUrl(profile.avatarUrl)}?v=${new Date(profile.updatedAt).getTime()}`
    : null;

  const showSavedPhoto = !!savedAvatarUrl && !pendingRemovePhoto && !pendingPhoto;
  const displayAvatarUrl = pendingPhotoPreview ?? (showSavedPhoto ? savedAvatarUrl : null);
  const canViewPhoto = !!displayAvatarUrl;
  const completion = profile?.completionPercent ?? 0;
  const displayName = fullName.trim() || user?.email?.split('@')[0] || 'Your name';
  const hasPhotoChanges = !!pendingPhoto || pendingRemovePhoto;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <SuccessModal
        open={showSuccess}
        message="Your profile has been saved to the database. All changes including your photo are now permanent."
        onClose={() => setShowSuccess(false)}
      />
      <ImageLightbox
        open={showImageLightbox}
        src={displayAvatarUrl}
        alt={displayName}
        onClose={() => setShowImageLightbox(false)}
      />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/dashboard" className="text-xs text-moons-blue hover:underline">
                ← Dashboard
              </Link>
              <h1 className="mt-1 text-xl font-bold text-moons-navy">My Moons Profile</h1>
              <p className="text-sm text-moons-muted">
                Build a Naukri-style profile recruiters trust
              </p>
            </div>
            <div className="min-w-[220px]">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Profile completion</span>
                <span className="text-moons-blue">{completion}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-moons-blue to-moons-orange transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActiveSection(section.id)}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-moons-blue'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => canViewPhoto && setShowImageLightbox(true)}
                  disabled={!canViewPhoto}
                  className={`group relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-2 ring-moons-blue/20 ${
                    canViewPhoto ? 'cursor-zoom-in hover:ring-moons-blue/50' : 'cursor-default'
                  }`}
                  aria-label={canViewPhoto ? 'View profile photo' : 'No profile photo'}
                >
                  {displayAvatarUrl ? (
                    <>
                      <img
                        src={displayAvatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                      {canViewPhoto && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-[10px] font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                          View
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-blue to-moons-blue-dark text-3xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {pendingPhoto && (
                    <span className="absolute bottom-0 left-0 right-0 bg-amber-500/90 py-0.5 text-center text-[9px] font-bold text-white">
                      Preview
                    </span>
                  )}
                </button>

                <div className="mt-3 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    className="rounded-full bg-moons-orange px-3 py-1 text-[11px] font-bold text-white shadow hover:bg-moons-orange-dark disabled:opacity-60"
                  >
                    {pendingPhoto ? 'Change photo' : 'Upload photo'}
                  </button>
                  {(showSavedPhoto || pendingPhoto) && !pendingRemovePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={saving}
                      className="text-[11px] font-medium text-red-500 hover:underline disabled:opacity-60"
                    >
                      Remove photo
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-moons-navy">{displayName}</h2>
                <p className="text-sm text-slate-600">
                  {headline || 'Add your current designation'}
                </p>
                <p className="mt-1 text-sm text-moons-muted">
                  {location || 'Add location'}
                  {experienceYears !== '' &&
                    ` · ${formatExperience(Number(experienceYears))}`}
                </p>
                <p className="mt-2 text-xs text-slate-500">{profile?.email ?? user?.email}</p>

                {pendingPhoto && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Preview shown for <strong>{pendingPhoto.name}</strong>. Click{' '}
                    <strong>Save profile</strong> below to save it permanently. Click the
                    photo to view full size.
                  </p>
                )}
                {pendingRemovePhoto && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Photo will be removed when you click <strong>Save profile</strong>.
                    <button
                      type="button"
                      onClick={cancelPhotoChanges}
                      className="ml-2 font-semibold text-moons-blue hover:underline"
                    >
                      Undo
                    </button>
                  </p>
                )}
                {!hasPhotoChanges && canViewPhoto && (
                  <p className="mt-3 text-[11px] text-slate-400">
                    Click your photo to view full size
                  </p>
                )}
                {!hasPhotoChanges && !canViewPhoto && (
                  <p className="mt-3 text-[11px] text-slate-400">
                    JPG, PNG or WEBP · Max 2 MB
                  </p>
                )}
              </div>
            </div>
          </section>

          <section id="personal" className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Personal details" subtitle="Name, contact & location" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Full name" required>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Priya Sharma" />
              </Field>
              <Field label="Mobile number" required>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Email" hint="Cannot be changed">
                <input value={profile?.email ?? user?.email ?? ''} disabled className={`${inputClass} bg-slate-50 text-slate-500`} />
              </Field>
              <Field label="Current city" required>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Bangalore, Karnataka" />
              </Field>
            </div>
          </section>

          <section id="career" className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Career profile" subtitle="Current role, company & experience" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Current designation" required>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} placeholder="Senior Software Engineer" />
              </Field>
              <Field label="Current company" required>
                <input value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} className={inputClass} placeholder="TechNova Labs" />
              </Field>
              <Field label="Total experience" required>
                <select value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className={inputClass}>
                  <option value="">Select experience</option>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notice period" required>
                <select value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} className={inputClass}>
                  <option value="">Select notice period</option>
                  {NOTICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section id="skills" className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Key skills" subtitle="Add skills recruiters search for (max 20)" />
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-moons-blue">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="text-moons-blue/60 hover:text-red-500" aria-label={`Remove ${skill}`}>×</button>
                  </span>
                ))}
              </div>
              {skills.length < 20 && (
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addSkill(skillInput.replace(',', ''));
                    }
                  }}
                  onBlur={() => addSkill(skillInput)}
                  className={`${inputClass} mt-3`}
                  placeholder="Type a skill and press Enter"
                />
              )}
            </div>
          </section>

          <section id="summary" className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Profile summary" subtitle="Brief overview of your experience & strengths" />
            <div className="p-5">
              <textarea
                rows={6}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className={`${inputClass} resize-y`}
                placeholder="Experienced software engineer with 5+ years..."
                maxLength={2000}
              />
              <p className="mt-1 text-right text-xs text-slate-400">{summary.length}/2000</p>
            </div>
          </section>

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="sticky bottom-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-moons-orange px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-moons-orange-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-moons-blue focus:ring-1 focus:ring-moons-blue';

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <h3 className="font-bold text-moons-navy">{title}</h3>
      <p className="text-xs text-moons-muted">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-moons-orange"> *</span>}
      </span>
      {hint && <span className="ml-2 text-xs text-slate-400">({hint})</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function formatExperience(years: number) {
  if (years === 0) return 'Fresher';
  if (years >= 31) return '30+ years exp';
  return `${years} yr${years === 1 ? '' : 's'} exp`;
}
