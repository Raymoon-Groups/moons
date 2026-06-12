'use client';

import { ChangeEvent, ReactNode, useRef, useState } from 'react';
import { ImageLightbox } from '@/components/image-lightbox';
import { resolveAssetUrl } from '@/lib/assets';
import type { Profile } from '@/lib/types';

export const inputClass =
  'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/20';

export const cardClass = 'overflow-hidden rounded-xl border border-border bg-white shadow-sm';

export type CompletionItem = {
  id: string;
  label: string;
  done: boolean;
  sectionId: string;
};

export function buildCandidateCompletionItems(
  data: {
    fullName: string;
    avatarUrl?: string | null;
    phone: string;
    headline: string;
    currentCompany: string;
    experienceYears: string;
    location: string;
    noticePeriod: string;
    currentCtc: string;
    expectedCtc: string;
    workExperiences: unknown[];
    educations: unknown[];
    summary: string;
    skills: string[];
    resumeUrl?: string | null;
    preferredRoles: string[];
    certifications: unknown[];
    pendingPhoto?: boolean;
    pendingResume?: boolean;
  },
): CompletionItem[] {
  const checks: CompletionItem[] = [
    { id: 'name', label: 'Full name', done: !!data.fullName.trim(), sectionId: 'personal' },
    {
      id: 'photo',
      label: 'Profile photo',
      done: !!data.avatarUrl || !!data.pendingPhoto,
      sectionId: 'photo',
    },
    { id: 'phone', label: 'Phone number', done: !!data.phone.trim(), sectionId: 'personal' },
    { id: 'headline', label: 'Current designation', done: !!data.headline.trim(), sectionId: 'career' },
    { id: 'company', label: 'Current company', done: !!data.currentCompany.trim(), sectionId: 'career' },
    {
      id: 'experience',
      label: 'Total experience',
      done: data.experienceYears !== '',
      sectionId: 'career',
    },
    { id: 'location', label: 'Location', done: !!data.location.trim(), sectionId: 'location' },
    { id: 'notice', label: 'Notice period', done: !!data.noticePeriod.trim(), sectionId: 'career' },
    { id: 'current-ctc', label: 'Current CTC', done: !!data.currentCtc.trim(), sectionId: 'salary' },
    { id: 'expected-ctc', label: 'Expected CTC', done: !!data.expectedCtc.trim(), sectionId: 'salary' },
    {
      id: 'employment',
      label: 'Employment history',
      done: data.workExperiences.length > 0,
      sectionId: 'experience',
    },
    { id: 'education', label: 'Education', done: data.educations.length > 0, sectionId: 'education' },
    { id: 'summary', label: 'Profile summary', done: !!data.summary.trim(), sectionId: 'summary' },
    { id: 'skills', label: 'Key skills', done: data.skills.length > 0, sectionId: 'skills' },
    {
      id: 'resume',
      label: 'Resume',
      done: !!data.resumeUrl || !!data.pendingResume,
      sectionId: 'resume',
    },
    {
      id: 'preferences',
      label: 'Job preferences',
      done: data.preferredRoles.length > 0,
      sectionId: 'preferences',
    },
    {
      id: 'certifications',
      label: 'Certifications',
      done: data.certifications.length > 0,
      sectionId: 'certifications',
    },
  ];
  return checks;
}

export function buildRecruiterCompletionItems(
  data: {
    fullName: string;
    avatarUrl?: string | null;
    companyLogoUrl?: string | null;
    phone: string;
    currentCompany: string;
    designation: string;
    companyWebsite: string;
    companySize: string;
    industry: string;
    companyType: string;
    location: string;
    officeAddress: string;
    summary: string;
    pendingPhoto?: boolean;
    pendingLogo?: boolean;
  },
): CompletionItem[] {
  return [
    { id: 'name', label: 'Full name', done: !!data.fullName.trim(), sectionId: 'personal' },
    {
      id: 'photo',
      label: 'Profile photo',
      done: !!data.avatarUrl || !!data.pendingPhoto,
      sectionId: 'photo',
    },
    {
      id: 'logo',
      label: 'Company logo',
      done: !!data.companyLogoUrl || !!data.pendingLogo,
      sectionId: 'branding',
    },
    { id: 'phone', label: 'Phone number', done: !!data.phone.trim(), sectionId: 'personal' },
    { id: 'company', label: 'Company name', done: !!data.currentCompany.trim(), sectionId: 'company' },
    { id: 'designation', label: 'Your designation', done: !!data.designation.trim(), sectionId: 'company' },
    { id: 'website', label: 'Company website', done: !!data.companyWebsite.trim(), sectionId: 'company' },
    { id: 'size', label: 'Company size', done: !!data.companySize.trim(), sectionId: 'company' },
    { id: 'industry', label: 'Industry', done: !!data.industry.trim(), sectionId: 'company' },
    { id: 'type', label: 'Company type', done: !!data.companyType.trim(), sectionId: 'company' },
    { id: 'location', label: 'Office city', done: !!data.location.trim(), sectionId: 'personal' },
    { id: 'address', label: 'Office address', done: !!data.officeAddress.trim(), sectionId: 'personal' },
    { id: 'about', label: 'About company', done: !!data.summary.trim(), sectionId: 'about' },
  ];
}

function itemWeight(total: number) {
  return Math.round(100 / total);
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-moons-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-moons-navy">{value || '—'}</p>
    </div>
  );
}

export function CompletionDonut({ percent }: { percent: number }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#e8ecf2" strokeWidth="14" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="14"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-moons-navy">{percent}%</span>
    </div>
  );
}

export function ProfileCompletionSidebar({
  items,
  completion,
}: {
  items: CompletionItem[];
  completion: number;
}) {
  const weight = itemWeight(items.length);

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={`${cardClass} p-6`}>
      <h3 className="text-center text-base font-bold text-moons-navy">Complete your profile</h3>
      <div className="mt-4">
        <CompletionDonut percent={completion} />
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => scrollToSection(item.sectionId)}
              className="flex w-full items-center justify-between gap-2 text-left text-sm"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    item.done ? 'bg-moons-navy text-white' : 'bg-surface text-moons-muted'
                  }`}
                >
                  {item.done ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={item.done ? 'text-moons-muted line-through' : 'text-foreground'}>
                  {item.label}
                </span>
              </span>
              <span
                className={`shrink-0 text-xs font-semibold ${
                  item.done ? 'text-moons-muted' : 'text-emerald-500'
                }`}
              >
                {item.done ? `${weight}%` : `+${weight}%`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EditableCard({
  id,
  title,
  viewContent,
  editContent,
  saving,
  defaultEditing = false,
}: {
  id: string;
  title: string;
  viewContent: ReactNode;
  editContent: ReactNode;
  saving?: boolean;
  defaultEditing?: boolean;
}) {
  const [editing, setEditing] = useState(defaultEditing);

  return (
    <section id={id} className={cardClass}>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-base font-bold text-moons-navy">{title}</h3>
        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm font-medium text-moons-muted transition hover:text-foreground"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-moons-muted transition hover:text-moons-blue"
          >
            <PencilIcon />
            Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {editing ? (
          <div className="space-y-4">
            {editContent}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-moons-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        ) : (
          viewContent
        )}
      </div>
    </section>
  );
}

export function Field({
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
      <span className="text-sm font-medium text-moons-muted">
        {label}
        {required && <span className="text-moons-orange"> *</span>}
      </span>
      {hint && <span className="ml-2 text-xs text-moons-muted">({hint})</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function formatExperience(years: number) {
  if (years === 0) return 'Fresher';
  if (years >= 31) return '30+ years exp';
  return `${years} yr${years === 1 ? '' : 's'} exp`;
}

interface ProfilePhotoSectionProps {
  profile: Profile | null;
  email: string;
  displayName: string;
  subtitle: string;
  metaLine: string;
  saving: boolean;
  onPhotoChange: (file: File | null, remove: boolean) => void;
  onError: (message: string) => void;
}

export function ProfilePhotoSection({
  profile,
  displayName,
  saving,
  onPhotoChange,
  onError,
}: ProfilePhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const savedAvatarUrl = profile?.avatarUrl
    ? `${resolveAssetUrl(profile.avatarUrl)}?v=${new Date(profile.updatedAt).getTime()}`
    : null;

  const showSaved = !!savedAvatarUrl && !pendingRemove && !pendingPhoto;
  const displayUrl = pendingPreview ?? (showSaved ? savedAvatarUrl : null);
  const canView = !!displayUrl;

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onError('Image must be 2 MB or smaller');
      return;
    }
    onError('');
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPhoto(file);
    setPendingPreview(URL.createObjectURL(file));
    setPendingRemove(false);
    onPhotoChange(file, false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemove() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPhoto(null);
    setPendingPreview(null);
    setPendingRemove(true);
    onPhotoChange(null, true);
    onError('');
  }

  function handleUndoRemove() {
    setPendingRemove(false);
    onPhotoChange(null, false);
    onError('');
  }

  return (
    <>
      <ImageLightbox
        open={showLightbox}
        src={displayUrl}
        alt={displayName}
        onClose={() => setShowLightbox(false)}
      />
      <section id="photo" className={`${cardClass} p-6`}>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => canView && setShowLightbox(true)}
            disabled={!canView}
            className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-surface shadow-md ring-2 ring-border ${
              canView ? 'cursor-zoom-in hover:ring-moons-blue/30' : 'cursor-default'
            }`}
          >
            {displayUrl ? (
              <img src={displayUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-blue to-moons-blue-dark text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          <div className="flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-moons-blue/40 hover:bg-surface disabled:opacity-60"
            >
              Upload new photo
            </button>
            <p className="mt-2 text-xs text-moons-muted">
              At least 800×800 px recommended. JPG, PNG or WEBP is allowed.
            </p>
            {(showSaved || pendingPhoto) && !pendingRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving}
                className="mt-2 text-xs font-medium text-red-500 hover:underline disabled:opacity-60"
              >
                Remove photo
              </button>
            )}
            {pendingPhoto && (
              <p className="mt-2 text-xs text-amber-700">
                Photo selected — click <strong>Save changes</strong> in any section to keep it.
              </p>
            )}
            {pendingRemove && (
              <p className="mt-2 text-xs text-amber-700">
                Photo will be removed on save.{' '}
                <button type="button" onClick={handleUndoRemove} className="font-semibold text-moons-blue hover:underline">
                  Undo
                </button>
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleSelect}
            />
          </div>
        </div>
      </section>
    </>
  );
}

interface CompanyLogoSectionProps {
  profile: Profile | null;
  companyName: string;
  saving: boolean;
  onLogoChange: (file: File | null, remove: boolean) => void;
  onError: (message: string) => void;
}

export function CompanyLogoSection({
  profile,
  companyName,
  saving,
  onLogoChange,
  onError,
}: CompanyLogoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const savedLogoUrl = profile?.companyLogoUrl
    ? `${resolveAssetUrl(profile.companyLogoUrl)}?v=${new Date(profile.updatedAt).getTime()}`
    : null;

  const showSaved = !!savedLogoUrl && !pendingRemove && !pendingLogo;
  const displayUrl = pendingPreview ?? (showSaved ? savedLogoUrl : null);
  const canView = !!displayUrl;

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onError('Image must be 2 MB or smaller');
      return;
    }
    onError('');
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingLogo(file);
    setPendingPreview(URL.createObjectURL(file));
    setPendingRemove(false);
    onLogoChange(file, false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemove() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingLogo(null);
    setPendingPreview(null);
    setPendingRemove(true);
    onLogoChange(null, true);
    onError('');
  }

  function handleUndoRemove() {
    setPendingRemove(false);
    onLogoChange(null, false);
    onError('');
  }

  return (
    <>
      <ImageLightbox
        open={showLightbox}
        src={displayUrl}
        alt={`${companyName} logo`}
        onClose={() => setShowLightbox(false)}
      />
      <section id="branding" className={`${cardClass} p-6`}>
        <h3 className="mb-4 text-base font-bold text-moons-navy">Company logo</h3>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => canView && setShowLightbox(true)}
            disabled={!canView}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface ${
              canView ? 'cursor-zoom-in hover:ring-2 hover:ring-moons-blue/30' : 'cursor-default'
            }`}
          >
            {displayUrl ? (
              <img src={displayUrl} alt={`${companyName} logo`} className="h-full w-full object-contain p-1" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-moons-muted">
                {companyName.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </button>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-moons-blue/40 hover:bg-surface disabled:opacity-60"
            >
              {savedLogoUrl || pendingLogo ? 'Upload new logo' : 'Upload logo'}
            </button>
            <p className="mt-2 text-xs text-moons-muted">JPG, PNG or WEBP · Max 2 MB</p>
            {(showSaved || pendingLogo) && !pendingRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving}
                className="mt-2 block text-xs font-medium text-red-500 hover:underline disabled:opacity-60"
              >
                Remove logo
              </button>
            )}
            {pendingLogo && (
              <p className="mt-2 text-xs text-amber-700">Logo selected — save profile to upload.</p>
            )}
            {pendingRemove && (
              <p className="mt-2 text-xs text-amber-700">
                Logo will be removed on save.{' '}
                <button type="button" onClick={handleUndoRemove} className="font-semibold text-moons-blue hover:underline">
                  Undo
                </button>
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleSelect}
            />
          </div>
        </div>
      </section>
    </>
  );
}

export function ProfilePageShell({
  title,
  completion,
  completionItems,
  children,
}: {
  title: string;
  completion: number;
  completionItems: CompletionItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <a href="/dashboard" className="text-xs font-medium text-moons-blue hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-moons-navy md:text-3xl">{title}</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          <div className="space-y-4">{children}</div>
          <aside className="lg:sticky lg:top-24">
            <ProfileCompletionSidebar items={completionItems} completion={completion} />
          </aside>
        </div>
      </div>
    </div>
  );
}
