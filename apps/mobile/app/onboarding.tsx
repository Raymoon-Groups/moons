import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { UserRole } from '@moons/shared';
import { AuthLayout } from '@/components/auth-layout';
import { SelectField } from '@/components/profile/select-field';
import {
  ErrorText,
  FieldLabel,
  Input,
  PrimaryButton,
} from '@/components/ui';
import { completeOnboarding } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/profile-constants';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function OnboardingScreen() {
  const { user, ready, updateUser } = useAuth();
  const { colors } = useTheme();
  const isRecruiter = user?.role === UserRole.RECRUITER;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [resume, setResume] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        resumeButton: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          padding: 14,
          backgroundColor: colors.surface,
          marginBottom: 8,
        },
        resumeText: { color: colors.foreground, fontSize: 14 },
      }),
    [colors],
  );

  useEffect(() => {
    if (ready && !user) router.replace('/login');
    if (ready && user?.onboardingCompleted) router.replace('/(tabs)');
  }, [ready, user]);

  async function pickResume() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) setResume(result.assets[0]);
  }

  async function handleSubmit() {
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      if (isRecruiter) {
        fd.append('companyName', companyName);
        fd.append('designation', designation);
        fd.append('companyWebsite', companyWebsite);
        fd.append('companySize', companySize);
        if (fullName.trim()) fd.append('fullName', fullName);
        if (industry.trim()) fd.append('industry', industry);
      } else {
        fd.append('fullName', fullName);
        fd.append('phone', phone);
        fd.append('location', location);
        if (headline.trim()) fd.append('headline', headline);
        if (resume) {
          fd.append('resume', {
            uri: resume.uri,
            name: resume.name,
            type: resume.mimeType ?? 'application/pdf',
          } as unknown as Blob);
        }
      }
      const result = await completeOnboarding(fd);
      await updateUser(result.user);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <AuthLayout
      title={isRecruiter ? 'Set up your company' : 'Complete your profile'}
      subtitle={
        isRecruiter
          ? 'Tell candidates about your company so you can start posting jobs.'
          : 'Add a few details so recruiters can find you and you can apply faster.'
      }
    >
      {isRecruiter ? (
        <>
          <FieldLabel>Company name</FieldLabel>
          <Input value={companyName} onChangeText={setCompanyName} placeholder="Acme Inc." />
          <FieldLabel>Your designation</FieldLabel>
          <Input value={designation} onChangeText={setDesignation} placeholder="HR Manager" />
          <FieldLabel>Company website</FieldLabel>
          <Input value={companyWebsite} onChangeText={setCompanyWebsite} placeholder="https://" />
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
          <FieldLabel>Your name (optional)</FieldLabel>
          <Input value={fullName} onChangeText={setFullName} placeholder="Full name" />
        </>
      ) : (
        <>
          <FieldLabel>Full name</FieldLabel>
          <Input value={fullName} onChangeText={setFullName} placeholder="Your full name" />
          <FieldLabel>Phone</FieldLabel>
          <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91…" />
          <FieldLabel>Location</FieldLabel>
          <Input value={location} onChangeText={setLocation} placeholder="City, State" />
          <FieldLabel>Headline (optional)</FieldLabel>
          <Input value={headline} onChangeText={setHeadline} placeholder="e.g. Frontend Developer" />
          <FieldLabel>Resume (optional)</FieldLabel>
          <Pressable onPress={pickResume} style={styles.resumeButton}>
            <Text style={styles.resumeText}>{resume ? resume.name : 'Upload resume (PDF or DOC)'}</Text>
          </Pressable>
        </>
      )}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <PrimaryButton
        label={loading ? 'Saving…' : 'Continue to dashboard'}
        onPress={handleSubmit}
        loading={loading}
      />
    </AuthLayout>
  );
}

