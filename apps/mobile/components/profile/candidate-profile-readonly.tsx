import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SectionCard } from '@/components/profile/section-card';
import { SecondaryButton } from '@/components/ui';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { Profile } from '@/lib/types';

function formatExperience(years: number) {
  if (years === 0) return 'Fresher';
  if (years >= 31) return '30+ years';
  return `${years} yr${years === 1 ? '' : 's'}`;
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  const { colors } = useTheme();
  if (!value?.trim()) return null;
  return (
    <View style={{ marginBottom: 8, flex: 1, minWidth: '45%' }}>
      <Text style={{ fontSize: 11, color: colors.muted, ...fontStyle('semibold') }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 14, color: colors.heading, ...fontStyle('semibold') }}>
        {value}
      </Text>
    </View>
  );
}

export function CandidateProfileReadonly({ profile }: { profile: Profile }) {
  const { colors } = useTheme();
  const displayName = profile.fullName?.trim() || profile.email.split('@')[0];
  const avatarSrc = profile.avatarUrl ? resolveAssetUrl(profile.avatarUrl) : null;
  const resumeUrl = profile.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
  const resumeFileName = profile.resumeFileName ?? 'View resume';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
        avatar: {
          width: 72,
          height: 72,
          borderRadius: 36,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        letter: { fontSize: 28, color: '#fff', ...fontStyle('bold') },
        name: { fontSize: 22, color: colors.heading, ...fontStyle('extrabold') },
        headline: { marginTop: 4, fontSize: 14, color: colors.foreground, ...fontStyle('regular') },
        meta: { marginTop: 6, fontSize: 13, color: colors.muted, ...fontStyle('regular') },
        contact: { marginTop: 8, fontSize: 13, color: colors.foreground, ...fontStyle('regular') },
        grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        expCard: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          backgroundColor: colors.surface,
        },
        expTitle: { fontSize: 15, color: colors.heading, ...fontStyle('bold') },
        expCompany: { marginTop: 2, fontSize: 14, color: colors.foreground, ...fontStyle('regular') },
        expDates: { marginTop: 4, fontSize: 12, color: colors.muted, ...fontStyle('regular') },
        body: { fontSize: 14, lineHeight: 22, color: colors.foreground, ...fontStyle('regular') },
        chip: {
          alignSelf: 'flex-start',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.full,
          paddingHorizontal: 10,
          paddingVertical: 5,
          marginRight: 6,
          marginBottom: 6,
        },
        chipText: { fontSize: 12, color: colors.blue, ...fontStyle('medium') },
      }),
    [colors],
  );

  return (
    <View>
      <SectionCard title="Candidate profile">
        <View style={styles.hero}>
          <View style={styles.avatar}>
            {avatarSrc ? (
              <Image source={{ uri: avatarSrc }} style={{ width: 72, height: 72 }} contentFit="cover" />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.blue,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={styles.letter}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
            <Text style={styles.meta}>
              {[profile.currentCompany, profile.location]
                .filter(Boolean)
                .join(' · ')}
              {profile.experienceYears != null
                ? ` · ${formatExperience(profile.experienceYears)}`
                : ''}
            </Text>
            <Text style={styles.contact}>{profile.email}</Text>
            {profile.phone ? <Text style={styles.contact}>{profile.phone}</Text> : null}
            {resumeUrl ? (
              <View style={{ marginTop: 10 }}>
                <SecondaryButton label={resumeFileName} onPress={() => Linking.openURL(resumeUrl)} />
              </View>
            ) : null}
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Career snapshot">
        <View style={styles.grid}>
          <DetailItem label="Current company" value={profile.currentCompany} />
          <DetailItem label="Notice period" value={profile.noticePeriod} />
          <DetailItem label="Current CTC" value={profile.currentCtc} />
          <DetailItem label="Expected CTC" value={profile.expectedCtc} />
        </View>
      </SectionCard>

      {profile.summary ? (
        <SectionCard title="Profile summary">
          <Text style={styles.body}>{profile.summary}</Text>
        </SectionCard>
      ) : null}

      {profile.workExperiences.length > 0 ? (
        <SectionCard title="Employment history">
          {profile.workExperiences.map((exp, i) => (
            <View key={i} style={styles.expCard}>
              <Text style={styles.expTitle}>{exp.designation}</Text>
              <Text style={styles.expCompany}>{exp.company}</Text>
              <Text style={styles.expDates}>
                {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
              </Text>
              {exp.description ? <Text style={[styles.body, { marginTop: 8 }]}>{exp.description}</Text> : null}
            </View>
          ))}
        </SectionCard>
      ) : null}

      {profile.educations.length > 0 ? (
        <SectionCard title="Education">
          {profile.educations.map((edu, i) => (
            <View key={i} style={styles.expCard}>
              <Text style={styles.expTitle}>{edu.degree}</Text>
              <Text style={styles.expCompany}>{edu.institute}</Text>
              <Text style={styles.expDates}>
                {[edu.fieldOfStudy, edu.year].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {profile.skills.length > 0 ? (
        <SectionCard title="Skills">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {profile.skills.map((skill) => (
              <View key={skill} style={styles.chip}>
                <Text style={styles.chipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {profile.certifications.length > 0 ? (
        <SectionCard title="Certifications">
          {profile.certifications.map((cert, i) => (
            <View key={i} style={styles.expCard}>
              <Text style={styles.expTitle}>{cert.name}</Text>
              <Text style={styles.expCompany}>
                {[cert.issuer, cert.year].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </View>
  );
}
