'use client';

import { FormEvent, useMemo, useState } from 'react';
import { SuccessModal } from '@/components/success-modal';
import { authDelete, authFetch, authUpload } from '@/lib/api-client';
import type { Profile } from '@/lib/types';
import { COMPANY_TYPE_OPTIONS, INDUSTRY_OPTIONS } from './profile-constants';
import {
  buildRecruiterCompletionItems,
  CompanyLogoSection,
  EditableCard,
  Field,
  inputClass,
  ProfilePageShell,
  ProfilePhotoSection,
  ReadOnlyValue,
} from './profile-shared';

const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

interface Props {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}

export function RecruiterProfileView({ profile: initial, onSaved }: Props) {
  const [profile, setProfile] = useState(initial);
  const [fullName, setFullName] = useState(initial.fullName ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [location, setLocation] = useState(initial.location ?? '');
  const [companyName, setCompanyName] = useState(initial.currentCompany ?? '');
  const [designation, setDesignation] = useState(initial.designation ?? '');
  const [companyWebsite, setCompanyWebsite] = useState(initial.companyWebsite ?? '');
  const [companySize, setCompanySize] = useState(initial.companySize ?? '');
  const [industry, setIndustry] = useState(initial.industry ?? '');
  const [companyType, setCompanyType] = useState(initial.companyType ?? '');
  const [officeAddress, setOfficeAddress] = useState(initial.officeAddress ?? '');
  const [summary, setSummary] = useState(initial.summary ?? '');

  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingRemoveLogo, setPendingRemoveLogo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);

  const displayName = fullName.trim() || companyName.trim() || profile.email.split('@')[0];

  const completionItems = useMemo(
    () =>
      buildRecruiterCompletionItems({
        fullName,
        avatarUrl: pendingRemovePhoto ? null : profile.avatarUrl,
        companyLogoUrl: pendingRemoveLogo ? null : profile.companyLogoUrl,
        phone,
        currentCompany: companyName,
        designation,
        companyWebsite,
        companySize,
        industry,
        companyType,
        location,
        officeAddress,
        summary,
        pendingPhoto: !!pendingPhoto,
        pendingLogo: !!pendingLogo,
      }),
    [
      fullName,
      profile.avatarUrl,
      profile.companyLogoUrl,
      phone,
      companyName,
      designation,
      companyWebsite,
      companySize,
      industry,
      companyType,
      location,
      officeAddress,
      summary,
      pendingPhoto,
      pendingLogo,
      pendingRemovePhoto,
      pendingRemoveLogo,
    ],
  );

  const liveCompletion = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100,
  );

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
          location,
          currentCompany: companyName,
          designation,
          companyWebsite,
          companySize,
          industry,
          companyType,
          officeAddress,
          summary,
        }),
      });

      if (pendingRemovePhoto) {
        await authDelete<Profile>('/profiles/me/avatar');
      } else if (pendingPhoto) {
        const formData = new FormData();
        formData.append('avatar', pendingPhoto);
        await authUpload<Profile>('/profiles/me/avatar', formData);
      }

      if (pendingRemoveLogo) {
        await authDelete<Profile>('/profiles/me/company-logo');
      } else if (pendingLogo) {
        const formData = new FormData();
        formData.append('logo', pendingLogo);
        await authUpload<Profile>('/profiles/me/company-logo', formData);
      }

      const saved = await authFetch<Profile>('/profiles/me');
      setProfile(saved);
      onSaved(saved);
      setPendingPhoto(null);
      setPendingRemovePhoto(false);
      setPendingLogo(null);
      setPendingRemoveLogo(false);
      setPhotoKey((k) => k + 1);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SuccessModal
        open={showSuccess}
        message="Your employer profile has been saved successfully."
        onClose={() => setShowSuccess(false)}
      />
      <ProfilePageShell
        title="Edit Profile"
        completion={liveCompletion}
        completionItems={completionItems}
      >
        <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
          <ProfilePhotoSection
            key={photoKey}
            profile={profile}
            email={profile.email}
            displayName={displayName}
            subtitle={designation || 'Add your designation'}
            metaLine={`${companyName || 'Add company name'}${location ? ` · ${location}` : ''}`}
            saving={saving}
            onPhotoChange={(file, remove) => {
              setPendingPhoto(file);
              setPendingRemovePhoto(remove);
            }}
            onError={setError}
          />

          <EditableCard
            id="personal"
            title="Personal Info"
            saving={saving}
            viewContent={
              <div className="grid gap-6 sm:grid-cols-2">
                <ReadOnlyValue label="Full Name" value={fullName} />
                <ReadOnlyValue label="Phone" value={phone} />
                <ReadOnlyValue label="Email" value={profile.email} />
                <ReadOnlyValue label="Office city" value={location} />
                <div className="sm:col-span-2">
                  <ReadOnlyValue label="Office address" value={officeAddress} />
                </div>
              </div>
            }
            editContent={
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your full name" required>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Phone number" required>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Email" hint="Cannot be changed">
                  <input value={profile.email} disabled className={`${inputClass} bg-surface text-moons-muted`} />
                </Field>
                <Field label="Office city" required>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="City, Country" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Office address" required>
                    <input
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      className={inputClass}
                      placeholder="Street, building, pin code"
                    />
                  </Field>
                </div>
              </div>
            }
          />

          <EditableCard
            id="company"
            title="Company information"
            saving={saving}
            viewContent={
              <div className="grid gap-6 sm:grid-cols-2">
                <ReadOnlyValue label="Company name" value={companyName} />
                <ReadOnlyValue label="Your designation" value={designation} />
                <ReadOnlyValue label="Company website" value={companyWebsite} />
                <ReadOnlyValue label="Company size" value={companySize} />
                <ReadOnlyValue label="Industry" value={industry} />
                <ReadOnlyValue label="Company type" value={companyType} />
              </div>
            }
            editContent={
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name" required>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Your designation" required>
                  <input value={designation} onChange={(e) => setDesignation(e.target.value)} className={inputClass} placeholder="HR Manager, Talent Lead…" />
                </Field>
                <Field label="Company website" required>
                  <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={inputClass} placeholder="https://example.com" />
                </Field>
                <Field label="Company size" required>
                  <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={inputClass}>
                    <option value="">Select company size</option>
                    {COMPANY_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Industry" required>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass}>
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Company type" required>
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className={inputClass}>
                    <option value="">Select company type</option>
                    {COMPANY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>
              </div>
            }
          />

          <CompanyLogoSection
            profile={profile}
            companyName={companyName || 'Company'}
            saving={saving}
            onLogoChange={(file, remove) => {
              setPendingLogo(file);
              setPendingRemoveLogo(remove);
            }}
            onError={setError}
          />

          <EditableCard
            id="about"
            title="Bio"
            saving={saving}
            viewContent={
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {summary.trim() || 'Describe your company culture and what you offer.'}
              </p>
            }
            editContent={
              <div>
                <textarea
                  rows={6}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className={`${inputClass} resize-y`}
                  placeholder="We are a fast-growing tech company hiring top talent…"
                  maxLength={2000}
                />
                <p className="mt-1 text-right text-xs text-moons-muted">{summary.length}/2000</p>
              </div>
            }
          />

          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        </form>
      </ProfilePageShell>
    </>
  );
}
