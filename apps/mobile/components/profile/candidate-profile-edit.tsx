import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CertificationListEditor,
  EducationListEditor,
  SkillsEditor,
  TagListEditor,
  WorkExperienceListEditor,
} from '@/components/profile/profile-editors';
import { ProfilePhotoUpload, type PickedImage } from '@/components/profile/photo-upload';
import { ResumeUpload, type PickedResume } from '@/components/profile/resume-upload';
import { SectionCard } from '@/components/profile/section-card';
import { SelectField } from '@/components/profile/select-field';
import {
  Card,
  ErrorText,
  FieldLabel,
  InfoText,
  Input,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { ApiError, authDelete, authFetch, authUpload } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import {
  CTC_OPTIONS,
  EXPERIENCE_OPTIONS,
  NOTICE_OPTIONS,
} from '@/lib/profile-constants';
import {
  sanitizeCertifications,
  sanitizeEducations,
  sanitizeWorkExperiences,
} from '@/lib/profile-sanitize';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type {
  CertificationEntry,
  EducationEntry,
  Profile,
  WorkExperienceEntry,
} from '@/lib/types';

export function CandidateProfileEdit({
  profile: initial,
  onSaved,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}) {
  const { colors } = useTheme();
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

  const [pendingPhoto, setPendingPhoto] = useState<PickedImage | null>(null);
  const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);
  const [pendingResume, setPendingResume] = useState<PickedResume | null>(null);
  const [pendingRemoveResume, setPendingRemoveResume] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [photoKey, setPhotoKey] = useState(0);

  const displayName = fullName.trim() || profile.email.split('@')[0];

  const headerStyles = useMemo(
    () =>
      StyleSheet.create({
        completion: {
          fontSize: 13,
          color: colors.muted,
          marginBottom: theme.spacing.md,
          ...fontStyle('regular'),
        },
        completionValue: { color: colors.blue, ...fontStyle('bold') },
        emailHint: { color: colors.muted, marginBottom: 8 },
      }),
    [colors],
  );

  async function refreshAfterUpload() {
    const saved = await authFetch<Profile>('/profiles/me');
    setProfile(saved);
    onSaved(saved);
    setInfo('Saved successfully.');
  }

  async function savePhotoOnly() {
    if (!pendingPhoto && !pendingRemovePhoto) return;
    setPhotoSaving(true);
    setError('');
    try {
      if (pendingRemovePhoto) {
        await authDelete('/profiles/me/avatar');
      } else if (pendingPhoto) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: pendingPhoto.uri,
          name: pendingPhoto.name,
          type: pendingPhoto.type,
        } as unknown as Blob);
        await authUpload('/profiles/me/avatar', formData);
      }
      setPendingPhoto(null);
      setPendingRemovePhoto(false);
      setPhotoKey((k) => k + 1);
      await refreshAfterUpload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save photo');
    } finally {
      setPhotoSaving(false);
    }
  }

  async function saveResumeOnly() {
    if (!pendingResume && !pendingRemoveResume) return;
    setResumeSaving(true);
    setError('');
    try {
      if (pendingRemoveResume) {
        await authDelete('/profiles/me/resume');
      } else if (pendingResume) {
        const formData = new FormData();
        formData.append('resume', {
          uri: pendingResume.uri,
          name: pendingResume.name,
          type: pendingResume.type,
        } as unknown as Blob);
        await authUpload('/profiles/me/resume', formData);
      }
      setPendingResume(null);
      setPendingRemoveResume(false);
      await refreshAfterUpload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save resume');
    } finally {
      setResumeSaving(false);
    }
  }

  async function handleSave() {
    setError('');
    setInfo('');
    setSaving(true);
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
        await authDelete('/profiles/me/avatar');
      } else if (pendingPhoto) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: pendingPhoto.uri,
          name: pendingPhoto.name,
          type: pendingPhoto.type,
        } as unknown as Blob);
        await authUpload('/profiles/me/avatar', formData);
      }

      if (pendingRemoveResume) {
        await authDelete('/profiles/me/resume');
      } else if (pendingResume) {
        const formData = new FormData();
        formData.append('resume', {
          uri: pendingResume.uri,
          name: pendingResume.name,
          type: pendingResume.type,
        } as unknown as Blob);
        await authUpload('/profiles/me/resume', formData);
      }

      const saved = await authFetch<Profile>('/profiles/me');
      setProfile(saved);
      onSaved(saved);
      setPendingPhoto(null);
      setPendingRemovePhoto(false);
      setPendingResume(null);
      setPendingRemoveResume(false);
      setPhotoKey((k) => k + 1);
      setInfo('Profile saved successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Text style={headerStyles.completion}>
        Profile completion:{' '}
        <Text style={headerStyles.completionValue}>{profile.completionPercent}%</Text>
      </Text>

      <SectionCard title="Profile photo">
        <ProfilePhotoUpload
          key={photoKey}
          profile={profile}
          displayName={displayName}
          saving={photoSaving || saving}
          onPick={(file, remove) => {
            setPendingPhoto(file);
            setPendingRemovePhoto(remove);
          }}
          onRemove={() => setPendingRemovePhoto(true)}
          onSave={savePhotoOnly}
          onError={setError}
        />
      </SectionCard>

      <SectionCard title="Personal info">
        <FieldLabel>Full name</FieldLabel>
        <Input value={fullName} onChangeText={setFullName} />
        <FieldLabel>Phone</FieldLabel>
        <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <FieldLabel>Email</FieldLabel>
        <Input value={profile.email} editable={false} style={headerStyles.emailHint} />
      </SectionCard>

      <SectionCard title="Location">
        <FieldLabel>Current city</FieldLabel>
        <Input value={location} onChangeText={setLocation} placeholder="City or remote" />
      </SectionCard>

      <SectionCard title="Career profile">
        <FieldLabel>Current designation</FieldLabel>
        <Input value={headline} onChangeText={setHeadline} placeholder="e.g. Software Engineer" />
        <FieldLabel>Current company</FieldLabel>
        <Input value={currentCompany} onChangeText={setCurrentCompany} />
        <SelectField
          label="Total experience"
          value={experienceYears}
          options={EXPERIENCE_OPTIONS}
          onChange={setExperienceYears}
        />
        <SelectField
          label="Notice period"
          value={noticePeriod}
          options={NOTICE_OPTIONS.map((o) => ({ label: o, value: o }))}
          onChange={setNoticePeriod}
        />
      </SectionCard>

      <SectionCard title="Salary details">
        <SelectField
          label="Current CTC"
          value={currentCtc}
          options={CTC_OPTIONS.map((o) => ({ label: o, value: o }))}
          onChange={setCurrentCtc}
        />
        <SelectField
          label="Expected CTC"
          value={expectedCtc}
          options={CTC_OPTIONS.map((o) => ({ label: o, value: o }))}
          onChange={setExpectedCtc}
        />
      </SectionCard>

      <SectionCard title="Resume">
        <ResumeUpload
          profile={profile}
          pendingFile={pendingResume}
          pendingRemove={pendingRemoveResume}
          saving={resumeSaving || saving}
          onPick={(file) => {
            setPendingResume(file);
            setPendingRemoveResume(false);
          }}
          onRemove={() => {
            setPendingResume(null);
            setPendingRemoveResume(true);
          }}
          onSave={saveResumeOnly}
          onError={setError}
        />
      </SectionCard>

      <SectionCard title="Employment history">
        <WorkExperienceListEditor value={workExperiences} onChange={setWorkExperiences} />
      </SectionCard>

      <SectionCard title="Education">
        <EducationListEditor value={educations} onChange={setEducations} />
      </SectionCard>

      <SectionCard title="Key skills">
        <SkillsEditor value={skills} onChange={setSkills} />
      </SectionCard>

      <SectionCard title="Certifications">
        <CertificationListEditor value={certifications} onChange={setCertifications} />
      </SectionCard>

      <SectionCard title="Job preferences">
        <TagListEditor
          label="Preferred roles"
          placeholder="e.g. Frontend Developer"
          value={preferredRoles}
          onChange={setPreferredRoles}
        />
        <TagListEditor
          label="Preferred locations"
          placeholder="e.g. Bangalore"
          value={preferredLocations}
          onChange={setPreferredLocations}
        />
        <TagListEditor
          label="Preferred industries"
          placeholder="e.g. IT Services"
          value={preferredIndustries}
          onChange={setPreferredIndustries}
        />
      </SectionCard>

      <SectionCard title="Bio">
        <FieldLabel>Summary</FieldLabel>
        <Input
          value={summary}
          onChangeText={setSummary}
          multiline
          maxLength={2000}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
          placeholder="Tell recruiters about your experience and goals…"
        />
        <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'right', marginTop: 4 }}>
          {summary.length}/2000
        </Text>
      </SectionCard>

      <Card>
        {error ? <ErrorText>{error}</ErrorText> : null}
        {info ? <InfoText>{info}</InfoText> : null}
        <PrimaryButton label={saving ? 'Saving…' : 'Save profile'} onPress={handleSave} loading={saving} />
      </Card>

      <View style={{ height: 32 }} />
    </Screen>
  );
}
