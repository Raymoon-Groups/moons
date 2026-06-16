'use client';

import { ChangeEvent, ReactNode, useRef, useState } from 'react';
import { ImageLightbox } from '@/components/image-lightbox';
import { resolveAssetUrl } from '@/lib/assets';
import type { Profile } from '@/lib/types';

export const inputClass =
  'w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-moons-blue focus:ring-2 focus:ring-moons-blue/20';

export const cardClass =
  'overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_4px_24px_rgba(26,39,68,0.06)] transition hover:shadow-[0_8px_32px_rgba(26,39,68,0.08)]';

export function getResumeDisplayName(
  profile: Pick<Profile, 'resumeUrl' | 'resumeFileName'>,
  pendingResume?: File | null,
  pendingRemoveResume?: boolean,
): string | null {
  if (pendingRemoveResume) return null;
  if (pendingResume) return pendingResume.name;
  if (profile.resumeFileName?.trim()) return profile.resumeFileName.trim();
  if (!profile.resumeUrl) return null;
  const ext = profile.resumeUrl.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'Resume.pdf';
  if (ext === 'doc' || ext === 'docx') return `Resume.${ext}`;
  return 'Resume';
}

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
    <div className="rounded-xl border border-border/60 bg-gradient-to-br from-surface/80 to-white px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-moons-navy">{value || '—'}</p>
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
        <circle cx="80" cy="80" r={r} fill="none" stroke="#e8ecf2" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#profile-ring)"
          strokeWidth="12"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="profile-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a7fd4" />
            <stop offset="100%" stopColor="#1a2744" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-moons-navy">{percent}%</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-moons-muted">complete</span>
      </div>
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
    <div className={`${cardClass} overflow-hidden`}>
      <div className="bg-gradient-to-br from-moons-blue/10 via-white to-moons-navy/5 px-6 pb-6 pt-5">
        <p className="font-script text-xl text-moons-blue">Profile strength</p>
        <h3 className="mt-0.5 text-base font-bold text-moons-navy">Complete your profile</h3>
        <div className="mt-5">
          <CompletionDonut percent={completion} />
        </div>
        {completion < 100 && (
          <p className="mt-4 text-center text-xs leading-relaxed text-moons-muted">
            A complete profile gets up to 3× more recruiter views.
          </p>
        )}
      </div>
      <ul className="divide-y divide-border/60 px-4 py-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => scrollToSection(item.sectionId)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-3 text-left text-sm transition hover:bg-surface/80"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                    item.done
                      ? 'bg-gradient-to-br from-moons-blue to-moons-navy text-white shadow-sm'
                      : 'border border-border bg-white text-moons-muted'
                  }`}
                >
                  {item.done ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={item.done ? 'text-moons-muted line-through' : 'font-medium text-foreground'}>
                  {item.label}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  item.done
                    ? 'bg-surface text-moons-muted'
                    : 'bg-moons-blue/10 text-moons-blue'
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
      <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-moons-blue/[0.06] via-white to-white px-6 py-4">
        <h3 className="flex items-center gap-2.5 text-base font-bold text-moons-navy">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-moons-blue/15 to-moons-navy/10 text-moons-blue">
            <SectionDotIcon />
          </span>
          {title}
        </h3>
        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-moons-muted transition hover:border-moons-blue/30 hover:text-foreground"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-full border border-moons-blue/20 bg-moons-blue/5 px-3.5 py-1.5 text-sm font-semibold text-moons-blue transition hover:bg-moons-blue/10"
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
            <div className="flex justify-end border-t border-border/60 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-moons-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue disabled:opacity-60"
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

function SectionDotIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
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
  onSave: () => void;
  onError: (message: string) => void;
}

export function ProfilePhotoSection({
  profile,
  displayName,
  saving,
  onPhotoChange,
  onSave,
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
      <section id="photo" className={cardClass}>
        <div className="h-24 bg-gradient-to-r from-moons-navy via-moons-blue to-[#5a8fd4]" aria-hidden />
        <div className="px-6 pb-6">
          <div className="-mt-14 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
            <button
              type="button"
              onClick={() => canView && setShowLightbox(true)}
              disabled={!canView}
              className={`relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-surface shadow-lg ring-2 ring-moons-blue/20 ${
                canView ? 'cursor-zoom-in hover:ring-moons-blue/40' : 'cursor-default'
              }`}
            >
              {displayUrl ? (
                <img src={displayUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moons-blue to-moons-navy text-3xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            <div className="flex-1 pb-1 sm:pb-2">
              <p className="text-lg font-bold text-moons-navy">{displayName}</p>
              <p className="mt-0.5 text-sm text-moons-muted">Profile photo</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="rounded-xl bg-moons-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-moons-blue disabled:opacity-60"
                >
                  Upload new photo
                </button>
                {(showSaved || pendingPhoto) && !pendingRemove && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={saving}
                    className="text-sm font-medium text-red-500 transition hover:text-red-600 disabled:opacity-60"
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-moons-muted">
                At least 800×800 px recommended. JPG, PNG or WEBP is allowed.
              </p>
            {pendingPhoto && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-xl bg-moons-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save photo'}
                </button>
              </div>
            )}
            {pendingRemove && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-amber-700">Photo will be removed when you save.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="rounded-xl bg-moons-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUndoRemove}
                    disabled={saving}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-60"
                  >
                    Undo
                  </button>
                </div>
              </div>
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
  onSave: () => void;
  onError: (message: string) => void;
}

export function CompanyLogoSection({
  profile,
  companyName,
  saving,
  onLogoChange,
  onSave,
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
              <div className="mt-3">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-lg bg-moons-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save logo'}
                </button>
              </div>
            )}
            {pendingRemove && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-amber-700">Logo will be removed when you save.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="rounded-lg bg-moons-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUndoRemove}
                    disabled={saving}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-60"
                  >
                    Undo
                  </button>
                </div>
              </div>
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
    <div className="min-h-screen bg-gradient-to-b from-[#eef2f9] via-[#f4f6fb] to-[#eef2f9]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-moons-blue shadow-sm backdrop-blur-sm transition hover:border-moons-blue/30 hover:bg-white"
        >
          ← Back to dashboard
        </a>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-script text-2xl text-moons-blue md:text-3xl">Your profile</p>
            <h1 className="text-2xl font-bold text-moons-navy md:text-3xl">{title}</h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-moons-blue/20 bg-white px-4 py-2 shadow-sm sm:flex">
            <span className="h-2 w-2 rounded-full bg-moons-blue" />
            <span className="text-sm font-semibold text-moons-navy">{completion}% complete</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="space-y-5">{children}</div>
          <aside className="lg:sticky lg:top-24">
            <ProfileCompletionSidebar items={completionItems} completion={completion} />
          </aside>
        </div>
      </div>
    </div>
  );
}
