'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { SuccessModal } from '@/components/success-modal';
import { authDelete, authFetch, authUpload } from '@/lib/api-client';
import { resolveAssetUrl } from '@/lib/assets';
import type { CertificationEntry, EducationEntry, Profile, WorkExperienceEntry } from '@/lib/types';
import {
  sanitizeCertifications,
  sanitizeEducations,
  sanitizeWorkExperiences,
} from '@/lib/profile-sanitize';
import { CTC_OPTIONS } from './profile-constants';
import {
  CertificationListEditor,
  EducationListEditor,
  TagListEditor,
  WorkExperienceListEditor,
} from './profile-editors';
import {
  buildCandidateCompletionItems,
  EditableCard,
  Field,
  formatExperience,
  getResumeDisplayName,
  inputClass,
  ProfilePageShell,
  ProfilePhotoSection,
  ReadOnlyValue,
} from './profile-shared';

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

interface Props {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}

export function CandidateProfileView({ profile: initial, onSaved }: Props) {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initial);
  const [fullName, setFullName] = useState(initial.fullName ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [headline, setHeadline] = useState(initial.headline ?? '');
  const [currentCompany, setCurrentCompany] = useState(initial.currentCompany ?? '');
  const [experienceYears, setExperienceYears] = useState(
    initial.experienceYears != null ? String(initial.experienceYears) : '',
  );
  const [location, setLocation] = useState(initial.location ?? '');
  const [noticePeriod, setNoticePeriod] = useState(initial.noticePeriod ?? '');
  const [summary, setSummary] = useState(initial.summary ?? '');
  const [skills, setSkills] = useState<string[]>(initial.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [currentCtc, setCurrentCtc] = useState(initial.currentCtc ?? '');
  const [expectedCtc, setExpectedCtc] = useState(initial.expectedCtc ?? '');
  const [educations, setEducations] = useState<EducationEntry[]>(initial.educations ?? []);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceEntry[]>(
    initial.workExperiences ?? [],
  );
  const [certifications, setCertifications] = useState<CertificationEntry[]>(
    initial.certifications ?? [],
  );
  const [preferredRoles, setPreferredRoles] = useState<string[]>(initial.preferredRoles ?? []);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    initial.preferredLocations ?? [],
  );
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>(
    initial.preferredIndustries ?? [],
  );

  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);
  const [pendingResume, setPendingResume] = useState<File | null>(null);
  const [pendingRemoveResume, setPendingRemoveResume] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);

  const displayName = fullName.trim() || profile.email.split('@')[0];
  const resumeUrl = profile.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
  const resumeFileName = getResumeDisplayName(profile, pendingResume, pendingRemoveResume);
  const experienceLabel =
    experienceYears === ''
      ? ''
      : EXPERIENCE_OPTIONS.find((o) => o.value === Number(experienceYears))?.label ?? '';

  const completionItems = useMemo(
    () =>
      buildCandidateCompletionItems({
        fullName,
        avatarUrl: pendingRemovePhoto ? null : profile.avatarUrl,
        phone,
        headline,
        currentCompany,
        experienceYears,
        location,
        noticePeriod,
        currentCtc,
        expectedCtc,
        workExperiences,
        educations,
        summary,
        skills,
        resumeUrl: pendingRemoveResume ? null : profile.resumeUrl,
        preferredRoles,
        certifications,
        pendingPhoto: !!pendingPhoto,
        pendingResume: !!pendingResume,
      }),
    [
      fullName,
      profile.avatarUrl,
      phone,
      headline,
      currentCompany,
      experienceYears,
      location,
      noticePeriod,
      currentCtc,
      expectedCtc,
      workExperiences,
      educations,
      summary,
      skills,
      profile.resumeUrl,
      preferredRoles,
      certifications,
      pendingPhoto,
      pendingResume,
      pendingRemovePhoto,
      pendingRemoveResume,
    ],
  );

  const liveCompletion = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100,
  );

  function addSkill(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSkills((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSkillInput('');
  }

  function handleResumeSelect(file: File | null) {
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      setError('Resume must be PDF or Word document');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume must be 5 MB or smaller');
      return;
    }
    setError('');
    setPendingResume(file);
    setPendingRemoveResume(false);
  }

  async function saveAvatarOnly() {
    if (!pendingPhoto && !pendingRemovePhoto) return;
    setSaving(true);
    setError('');
    try {
      if (pendingRemovePhoto) {
        await authDelete<Profile>('/profiles/me/avatar');
      } else if (pendingPhoto) {
        const formData = new FormData();
        formData.append('avatar', pendingPhoto);
        await authUpload<Profile>('/profiles/me/avatar', formData);
      }
      const saved = await authFetch<Profile>('/profiles/me');
      setProfile(saved);
      onSaved(saved);
      setPendingPhoto(null);
      setPendingRemovePhoto(false);
      setPhotoKey((k) => k + 1);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save photo');
    } finally {
      setSaving(false);
    }
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
          experienceYears: experienceYears === '' ? null : Number(experienceYears),
          location,
          noticePeriod,
          currentCtc,
          expectedCtc,
          educations: sanitizeEducations(educations),
          workExperiences: sanitizeWorkExperiences(workExperiences),
          certifications: sanitizeCertifications(certifications),
          preferredRoles,
          preferredLocations,
          preferredIndustries,
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

      if (pendingRemoveResume) {
        await authDelete<Profile>('/profiles/me/resume');
      } else if (pendingResume) {
        const formData = new FormData();
        formData.append('resume', pendingResume);
        await authUpload<Profile>('/profiles/me/resume', formData);
      }

      const saved = await authFetch<Profile>('/profiles/me');
      setProfile(saved);
      onSaved(saved);
      setPendingPhoto(null);
      setPendingRemovePhoto(false);
      setPendingResume(null);
      setPendingRemoveResume(false);
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
        message="Your jobseeker profile has been saved successfully."
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
            subtitle={headline || 'Add your current designation'}
            metaLine={`${location || 'Add location'}${experienceYears !== '' ? ` · ${formatExperience(Number(experienceYears))}` : ''}`}
            saving={saving}
            onPhotoChange={(file, remove) => {
              setPendingPhoto(file);
              setPendingRemovePhoto(remove);
            }}
            onSave={saveAvatarOnly}
            onError={setError}
          />

          <EditableCard
            id="personal"
            title="Personal Info"
            saving={saving}
            viewContent={
              <div className="grid gap-6 sm:grid-cols-3">
                <ReadOnlyValue label="Full Name" value={fullName} />
                <ReadOnlyValue label="Email" value={profile.email} />
                <ReadOnlyValue label="Phone" value={phone} />
              </div>
            }
            editContent={
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Mobile number" required>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Email" hint="Cannot be changed">
                  <input value={profile.email} disabled className={`${inputClass} bg-surface text-moons-muted`} />
                </Field>
              </div>
            }
          />

          <EditableCard
            id="location"
            title="Location"
            saving={saving}
            viewContent={<ReadOnlyValue label="Current city" value={location} />}
            editContent={
              <Field label="Current city" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-moons-muted">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="City or remote"
                  />
                </div>
              </Field>
            }
          />

          <EditableCard
            id="career"
            title="Career profile"
            saving={saving}
            viewContent={
              <div className="grid gap-6 sm:grid-cols-2">
                <ReadOnlyValue label="Current designation" value={headline} />
                <ReadOnlyValue label="Current company" value={currentCompany} />
                <ReadOnlyValue label="Total experience" value={experienceLabel} />
                <ReadOnlyValue label="Notice period" value={noticePeriod} />
              </div>
            }
            editContent={
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current designation" required>
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Current company" required>
                  <input value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} className={inputClass} />
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
            }
          />

          <EditableCard
            id="experience"
            title="Employment history"
            saving={saving}
            viewContent={
              <div className="space-y-2 text-sm text-foreground">
                {workExperiences.length === 0 ? (
                  <p className="text-moons-muted">No employment entries added yet.</p>
                ) : (
                  workExperiences.map((exp, i) => (
                    <p key={i}>
                      <span className="font-semibold text-heading">{exp.designation || 'Role'}</span>
                      {exp.company ? ` at ${exp.company}` : ''}
                    </p>
                  ))
                )}
              </div>
            }
            editContent={<WorkExperienceListEditor value={workExperiences} onChange={setWorkExperiences} />}
          />

          <EditableCard
            id="education"
            title="Education"
            saving={saving}
            viewContent={
              <div className="space-y-2 text-sm text-foreground">
                {educations.length === 0 ? (
                  <p className="text-moons-muted">No education entries added yet.</p>
                ) : (
                  educations.map((edu, i) => (
                    <p key={i}>
                      <span className="font-semibold text-heading">{edu.degree || 'Degree'}</span>
                      {edu.institute ? ` — ${edu.institute}` : ''}
                    </p>
                  ))
                )}
              </div>
            }
            editContent={<EducationListEditor value={educations} onChange={setEducations} />}
          />

          <EditableCard
            id="salary"
            title="Salary details"
            saving={saving}
            viewContent={
              <div className="grid gap-6 sm:grid-cols-2">
                <ReadOnlyValue label="Current CTC" value={currentCtc} />
                <ReadOnlyValue label="Expected CTC" value={expectedCtc} />
              </div>
            }
            editContent={
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current CTC" required>
                  <select value={currentCtc} onChange={(e) => setCurrentCtc(e.target.value)} className={inputClass}>
                    <option value="">Select current CTC</option>
                    {CTC_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Expected CTC" required>
                  <select value={expectedCtc} onChange={(e) => setExpectedCtc(e.target.value)} className={inputClass}>
                    <option value="">Select expected CTC</option>
                    {CTC_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>
              </div>
            }
          />

          <EditableCard
            id="preferences"
            title="Job preferences"
            saving={saving}
            viewContent={
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-moons-muted">Preferred roles</p>
                  <p className="mt-1 text-sm text-foreground">
                    {preferredRoles.length ? preferredRoles.join(', ') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-moons-muted">Preferred locations</p>
                  <p className="mt-1 text-sm text-foreground">
                    {preferredLocations.length ? preferredLocations.join(', ') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-moons-muted">Preferred industries</p>
                  <p className="mt-1 text-sm text-foreground">
                    {preferredIndustries.length ? preferredIndustries.join(', ') : '—'}
                  </p>
                </div>
              </div>
            }
            editContent={
              <div className="space-y-5">
                <TagListEditor
                  label="Preferred roles"
                  placeholder="e.g. Frontend Developer — press Enter"
                  value={preferredRoles}
                  onChange={setPreferredRoles}
                />
                <TagListEditor
                  label="Preferred locations"
                  placeholder="e.g. Bangalore, Remote — press Enter"
                  value={preferredLocations}
                  onChange={setPreferredLocations}
                />
                <TagListEditor
                  label="Preferred industries"
                  placeholder="e.g. IT Services, FinTech — press Enter"
                  value={preferredIndustries}
                  onChange={setPreferredIndustries}
                />
              </div>
            }
          />

          <EditableCard
            id="resume"
            title="Resume"
            saving={saving}
            viewContent={
              <div className="text-sm text-foreground">
                {resumeUrl && resumeFileName ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 font-medium text-moons-blue hover:bg-surface-hover hover:underline"
                  >
                    <ResumeDocIcon />
                    <span className="truncate">{resumeFileName}</span>
                  </a>
                ) : pendingResume ? (
                  <p className="inline-flex max-w-full items-center gap-2">
                    <ResumeDocIcon />
                    <span>
                      Pending upload: <strong className="truncate">{pendingResume.name}</strong>
                    </span>
                  </p>
                ) : (
                  <p className="text-moons-muted">No resume uploaded yet.</p>
                )}
              </div>
            }
            editContent={
              <div className="space-y-4">
                {resumeUrl && resumeFileName && !pendingResume && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-moons-blue hover:bg-surface-hover"
                  >
                    <ResumeDocIcon />
                    <span className="truncate">{resumeFileName}</span>
                  </a>
                )}
                {pendingResume && (
                  <p className="inline-flex max-w-full items-center gap-2 text-sm text-amber-800">
                    <ResumeDocIcon />
                    <span>
                      New resume selected: <strong>{pendingResume.name}</strong> — save to upload.
                    </span>
                  </p>
                )}
                {pendingRemoveResume && (
                  <p className="text-sm text-amber-800">
                    Resume will be removed on save.{' '}
                    <button type="button" onClick={() => setPendingRemoveResume(false)} className="font-semibold text-moons-blue hover:underline">
                      Undo
                    </button>
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={saving}
                    className="rounded-lg bg-moons-blue px-4 py-2 text-sm font-semibold text-white hover:bg-moons-blue-dark disabled:opacity-60"
                  >
                    {resumeUrl ? 'Replace resume' : 'Upload resume'}
                  </button>
                  {(resumeUrl || pendingResume) && !pendingRemoveResume && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingResume(null);
                        setPendingRemoveResume(true);
                      }}
                      disabled={saving}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Remove resume
                    </button>
                  )}
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => handleResumeSelect(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-moons-muted">PDF or Word · Max 5 MB</p>
              </div>
            }
          />

          <EditableCard
            id="skills"
            title="Key skills"
            saving={saving}
            viewContent={
              <div className="flex flex-wrap gap-2">
                {skills.length === 0 ? (
                  <p className="text-sm text-moons-muted">No skills added yet.</p>
                ) : (
                  skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-moons-blue/20 bg-gradient-to-r from-moons-blue/10 to-moons-navy/5 px-3.5 py-1 text-sm font-medium text-heading">
                      {skill}
                    </span>
                  ))
                )}
              </div>
            }
            editContent={
              <div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-moons-blue">
                      {skill}
                      <button type="button" onClick={() => setSkills((p) => p.filter((s) => s !== skill))} className="text-moons-blue/60 hover:text-red-500">×</button>
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
            }
          />

          <EditableCard
            id="certifications"
            title="Certifications"
            saving={saving}
            viewContent={
              <div className="space-y-2 text-sm text-foreground">
                {certifications.length === 0 ? (
                  <p className="text-moons-muted">No certifications added yet.</p>
                ) : (
                  certifications.map((cert, i) => (
                    <p key={i}>
                      <span className="font-semibold text-heading">{cert.name || 'Certification'}</span>
                      {cert.issuer ? ` — ${cert.issuer}` : ''}
                    </p>
                  ))
                )}
              </div>
            }
            editContent={<CertificationListEditor value={certifications} onChange={setCertifications} />}
          />

          <EditableCard
            id="summary"
            title="Bio"
            saving={saving}
            viewContent={
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {summary.trim() || 'Add a short summary about your experience and strengths.'}
              </p>
            }
            editContent={
              <div>
                <textarea
                  rows={6}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className={`${inputClass} resize-y`}
                  maxLength={2000}
                  placeholder="Brief overview of your experience & strengths"
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

function ResumeDocIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-moons-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
