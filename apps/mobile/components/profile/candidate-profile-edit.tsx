import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CertificationListEditor,
  EducationListEditor,
  SkillsEditor,
  TagListEditor,
  WorkExperienceListEditor,
} from '@/components/profile/profile-editors';
import { EditProfileHero } from '@/components/profile/edit-profile-hero';
import { type PickedImage } from '@/components/profile/photo-upload';
import { ProfileSuccessModal } from '@/components/profile/profile-success-modal';
import { ResumeUpload, type PickedResume } from '@/components/profile/resume-upload';
import { SelectField } from '@/components/profile/select-field';
import { CoverPhotoBanner } from '@/components/network/cover-photo-banner';
import { ErrorText } from '@/components/ui';
import { ApiError, authDelete, authFetch, authUpload } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
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
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type {
  CertificationEntry,
  EducationEntry,
  Profile,
  WorkExperienceEntry,
} from '@/lib/types';

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  multiline = false,
  maxLength,
  keyboardType,
  showCounter = false,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  editable?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  showCounter?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }, fontStyle('semibold')]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={editable}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            color: colors.heading,
            backgroundColor: isDark ? colors.surface : '#fff',
            borderColor: focused ? colors.blue : isDark ? colors.border : '#E5E7EB',
            opacity: editable ? 1 : 0.7,
          },
          fontStyle('regular'),
        ]}
      />
      {showCounter && maxLength ? (
        <Text style={[styles.counter, { color: colors.muted }, fontStyle('medium')]}>
          {value.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}

export function CandidateProfileEdit({
  profile: initial,
  onSaved,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}) {
  const { colors, isDark } = useTheme();
  const tabBarBottomPad = useTabScreenPadding(12);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);

  const displayName = fullName.trim() || profile.email.split('@')[0];
  const handle = `@${profile.email.split('@')[0]}`;

  const avatarUrl = useMemo(() => {
    if (pendingRemovePhoto) return null;
    if (pendingPhoto?.uri) return pendingPhoto.uri;
    if (!profile.avatarUrl) return null;
    return `${resolveAssetUrl(profile.avatarUrl)}?v=${new Date(profile.updatedAt).getTime()}&k=${photoKey}`;
  }, [pendingPhoto, pendingRemovePhoto, profile.avatarUrl, profile.updatedAt, photoKey]);

  const pageBg = isDark ? colors.background : '#F3F4F6';
  const cardBg = isDark ? colors.surfaceElevated : '#fff';

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      setError('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
      setError('Image must be 2 MB or smaller');
      return;
    }
    setError('');
    setPendingRemovePhoto(false);
    setPendingPhoto({
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      type: mime,
    });
  }

  async function saveResumeOnly() {
    if (!pendingResume && !pendingRemoveResume) return;
    setSaving(true);
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
      const saved = await authFetch<Profile>('/profiles/me');
      setProfile(saved);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setError('');
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
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.completion, { color: colors.muted }, fontStyle('medium')]}>
            Profile completion{' '}
            <Text style={[{ color: colors.blue }, fontStyle('bold')]}>{profile.completionPercent}%</Text>
          </Text>

          <EditProfileHero
            displayName={displayName}
            handle={handle}
            imageUrl={avatarUrl}
            onPressCamera={() => void pickPhoto()}
          />

          <View style={[styles.card, { backgroundColor: cardBg, padding: 0, overflow: 'hidden' }, theme.shadow.soft]}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.heading, paddingHorizontal: 16, paddingTop: 16 },
                fontStyle('bold'),
              ]}
            >
              Cover photo
            </Text>
            <CoverPhotoBanner
              bannerUrl={profile.bannerUrl ?? null}
              updatedAt={profile.updatedAt}
              editable
              onUpdated={(nextUrl, updatedAt) => {
                setProfile((prev) => ({
                  ...prev,
                  bannerUrl: nextUrl,
                  updatedAt,
                }));
                onSaved({
                  ...profile,
                  bannerUrl: nextUrl,
                  updatedAt,
                });
              }}
            />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <FormField label="Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
            <FormField label="Email" value={profile.email} editable={false} />
            <FormField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            <FormField
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="City or remote"
            />
            <FormField
              label="Headline"
              value={headline}
              onChangeText={setHeadline}
              placeholder="e.g. Software Engineer"
            />
            <FormField
              label="Bio"
              value={summary}
              onChangeText={setSummary}
              placeholder="Write a short bio about yourself"
              multiline
              maxLength={500}
              showCounter
            />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>Career</Text>
            <FormField
              label="Current company"
              value={currentCompany}
              onChangeText={setCurrentCompany}
              placeholder="Company name"
            />
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
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>Salary</Text>
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
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>Resume</Text>
            <ResumeUpload
              profile={profile}
              pendingFile={pendingResume}
              pendingRemove={pendingRemoveResume}
              saving={saving}
              onPick={(file) => {
                setPendingResume(file);
                setPendingRemoveResume(false);
              }}
              onRemove={() => {
                setPendingResume(null);
                setPendingRemoveResume(true);
              }}
              onSave={() => void saveResumeOnly()}
              onError={setError}
            />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>
              Employment history
            </Text>
            <WorkExperienceListEditor value={workExperiences} onChange={setWorkExperiences} />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>Education</Text>
            <EducationListEditor value={educations} onChange={setEducations} />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>Skills</Text>
            <SkillsEditor value={skills} onChange={setSkills} />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>
              Certifications
            </Text>
            <CertificationListEditor value={certifications} onChange={setCertifications} />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }, theme.shadow.soft]}>
            <Text style={[styles.cardTitle, { color: colors.heading }, fontStyle('bold')]}>
              Job preferences
            </Text>
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
          </View>

          {error ? (
            <View style={styles.errorWrap}>
              <ErrorText>{error}</ErrorText>
            </View>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: pageBg,
              paddingBottom: tabBarBottomPad,
              borderTopColor: isDark ? colors.border : '#E5E7EB',
            },
          ]}
        >
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving}
            style={[
              styles.updateBtn,
              { backgroundColor: colors.blue, opacity: saving ? 0.7 : 1 },
              theme.shadow.button,
            ]}
          >
            <Text style={[styles.updateText, fontStyle('bold')]}>
              {saving ? 'Updating…' : 'Update'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ProfileSuccessModal visible={showSuccess} onClose={() => setShowSuccess(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: 16,
    paddingTop: 12,
  },
  completion: {
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  counter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  errorWrap: {
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  updateBtn: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  updateText: {
    color: '#fff',
    fontSize: 16,
  },
});
