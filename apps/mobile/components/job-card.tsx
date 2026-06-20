import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CompanyAvatar } from './company-avatar';
import { Chip } from './status-badge';
import { formatEmploymentType, formatPostedAgo } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

export function JobCard({
  job,
  onPress,
  showApply = false,
}: {
  job: JobListing;
  onPress: () => void;
  showApply?: boolean;
}) {
  const { colors } = useTheme();
  const logoUrl = resolveAssetUrl(job.companyLogoUrl);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: theme.spacing.md,
          overflow: 'hidden',
          ...theme.shadow.soft,
        },
        pressed: { opacity: 0.94, transform: [{ scale: 0.998 }] },
        accent: { height: 3, backgroundColor: colors.blue },
        body: { padding: theme.spacing.md },
        topRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
        main: { flex: 1, minWidth: 0 },
        title: {
          fontSize: 17,
          ...fontStyle('extrabold'),
          color: colors.heading,
          lineHeight: 23,
        },
        subtitle: {
          marginTop: 4,
          fontSize: 13,
          ...fontStyle('regular'),
          color: colors.muted,
        },
        meta: {
          marginTop: theme.spacing.sm,
          fontSize: 13,
          ...fontStyle('medium'),
          color: colors.foreground,
        },
        footer: {
          marginTop: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        applyPill: {
          backgroundColor: colors.blue,
          borderRadius: theme.radius.sm,
          paddingHorizontal: 16,
          paddingVertical: 9,
        },
        applyText: {
          color: colors.white,
          fontSize: 13,
          ...fontStyle('bold'),
        },
        posted: {
          fontSize: 11,
          ...fontStyle('medium'),
          color: colors.muted,
        },
      }),
    [colors],
  );

  const typeLabel = formatEmploymentType(job.employmentType);
  const metaLine = [job.salaryRange, job.minExperienceYears != null ? `${job.minExperienceYears}+ yrs` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <CompanyAvatar name={job.companyName} size={52} imageUrl={logoUrl} />
          <View style={styles.main}>
            <Text style={styles.title} numberOfLines={2}>
              {job.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {job.companyName} · {job.location || 'Remote'}
            </Text>
          </View>
        </View>

        <Chip label={typeLabel} />

        <Text style={styles.meta} numberOfLines={1}>
          {metaLine || 'Competitive package'}
        </Text>

        <View style={styles.footer}>
          {showApply ? (
            <View style={styles.applyPill}>
              <Text style={styles.applyText}>Apply now</Text>
            </View>
          ) : (
            <View />
          )}
          <Text style={styles.posted}>{formatPostedAgo(job.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
