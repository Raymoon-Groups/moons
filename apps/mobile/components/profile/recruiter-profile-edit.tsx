import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CompanyLogoUpload,
  ProfilePhotoUpload,
  type PickedImage,
} from '@/components/profile/photo-upload';
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
  COMPANY_SIZE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
} from '@/lib/profile-constants';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export function RecruiterProfileEdit({
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
  const [location, setLocation] = useState(initial.location ?? '');
  const [companyName, setCompanyName] = useState(initial.currentCompany ?? '');
  const [designation, setDesignation] = useState(initial.designation ?? '');
  const [companyWebsite, setCompanyWebsite] = useState(initial.companyWebsite ?? '');
  const [companySize, setCompanySize] = useState(initial.companySize ?? '');
  const [industry, setIndustry] = useState(initial.industry ?? '');
  const [companyType, setCompanyType] = useState(initial.companyType ?? '');
  const [officeAddress, setOfficeAddress] = useState(initial.officeAddress ?? '');
  const [summary, setSummary] = useState(initial.summary ?? '');

  const [pendingPhoto, setPendingPhoto] = useState<PickedImage | null>(null);
  const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<PickedImage | null>(null);
  const [pendingRemoveLogo, setPendingRemoveLogo] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [logoSaving, setLogoSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [photoKey, setPhotoKey] = useState(0);
  const [logoKey, setLogoKey] = useState(0);

  const displayName = fullName.trim() || companyName.trim() || profile.email.split('@')[0];

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

  async function saveLogoOnly() {
    if (!pendingLogo && !pendingRemoveLogo) return;
    setLogoSaving(true);
    setError('');
    try {
      if (pendingRemoveLogo) {
        await authDelete('/profiles/me/company-logo');
      } else if (pendingLogo) {
        const formData = new FormData();
        formData.append('logo', {
          uri: pendingLogo.uri,
          name: pendingLogo.name,
          type: pendingLogo.type,
        } as unknown as Blob);
        await authUpload('/profiles/me/company-logo', formData);
      }
      setPendingLogo(null);
      setPendingRemoveLogo(false);
      setLogoKey((k) => k + 1);
      await refreshAfterUpload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save logo');
    } finally {
      setLogoSaving(false);
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

      if (pendingRemoveLogo) {
        await authDelete('/profiles/me/company-logo');
      } else if (pendingLogo) {
        const formData = new FormData();
        formData.append('logo', {
          uri: pendingLogo.uri,
          name: pendingLogo.name,
          type: pendingLogo.type,
        } as unknown as Blob);
        await authUpload('/profiles/me/company-logo', formData);
      }

      const saved = await authFetch<Profile>('/profiles/me');
      setProfile(saved);
      onSaved(saved);
      setPendingPhoto(null);
      setPendingRemovePhoto(false);
      setPendingLogo(null);
      setPendingRemoveLogo(false);
      setPhotoKey((k) => k + 1);
      setLogoKey((k) => k + 1);
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

      <SectionCard title="Company logo">
        <CompanyLogoUpload
          key={logoKey}
          profile={profile}
          companyName={companyName}
          saving={logoSaving || saving}
          onPick={(file, remove) => {
            setPendingLogo(file);
            setPendingRemoveLogo(remove);
          }}
          onRemove={() => setPendingRemoveLogo(true)}
          onSave={saveLogoOnly}
          onError={setError}
        />
      </SectionCard>

      <SectionCard title="Personal info">
        <FieldLabel>Your name</FieldLabel>
        <Input value={fullName} onChangeText={setFullName} />
        <FieldLabel>Phone</FieldLabel>
        <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <FieldLabel>Email</FieldLabel>
        <Input value={profile.email} editable={false} style={headerStyles.emailHint} />
        <FieldLabel>Office city</FieldLabel>
        <Input value={location} onChangeText={setLocation} placeholder="City" />
        <FieldLabel>Office address</FieldLabel>
        <Input
          value={officeAddress}
          onChangeText={setOfficeAddress}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </SectionCard>

      <SectionCard title="Company information">
        <FieldLabel>Company name</FieldLabel>
        <Input value={companyName} onChangeText={setCompanyName} />
        <FieldLabel>Your designation</FieldLabel>
        <Input value={designation} onChangeText={setDesignation} />
        <FieldLabel>Company website</FieldLabel>
        <Input
          value={companyWebsite}
          onChangeText={setCompanyWebsite}
          autoCapitalize="none"
          keyboardType="url"
        />
        <SelectField
          label="Company size"
          value={companySize}
          options={COMPANY_SIZE_OPTIONS.map((o) => ({ label: o, value: o }))}
          onChange={setCompanySize}
        />
        <SelectField
          label="Industry"
          value={industry}
          options={INDUSTRY_OPTIONS.map((o) => ({ label: o, value: o }))}
          onChange={setIndustry}
        />
        <SelectField
          label="Company type"
          value={companyType}
          options={COMPANY_TYPE_OPTIONS.map((o) => ({ label: o, value: o }))}
          onChange={setCompanyType}
        />
      </SectionCard>

      <SectionCard title="About company">
        <FieldLabel>Company summary</FieldLabel>
        <Input
          value={summary}
          onChangeText={setSummary}
          multiline
          maxLength={2000}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
          placeholder="Describe your company, culture, and what you hire for…"
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
