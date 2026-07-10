import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmploymentType } from '@moons/shared';
import { CompanyAvatar } from './company-avatar';
import { formatEmploymentType, formatPostedAgo } from '@/lib/format';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

function employmentAccent(type: string, colors: { blue: string; success: string; warning: string }) {
  switch (type) {
    case EmploymentType.REMOTE:
      return colors.success;
    case EmploymentType.INTERNSHIP:
      return colors.warning;
    default:
      return colors.blue;
  }
}

function isRecentJob(createdAt: string) {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return days <= 3;
}

export function JobCard({
  job,
  onPress,
  showApply = false,
}: {
  job: JobListing;
  onPress: () => void;
  showApply?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const logoUrl = resolveAssetUrl(job.companyLogoUrl);
  const accent = employmentAccent(job.employmentType, colors);
  const recent = isRecentJob(job.createdAt);

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
          flexDirection: 'row',
          ...theme.shadow.card,
        },
        pressed: { opacity: 0.95, transform: [{ scale: 0.995 }] },
        accentBar: { width: 4, backgroundColor: accent },
        body: { flex: 1, padding: theme.spacing.md },
        topRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
        avatarRing: {
          padding: 2,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: `${accent}44`,
          backgroundColor: isDark ? colors.surface : '#fff',
        },
        main: { flex: 1, minWidth: 0 },
        badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
        newBadge: {
          backgroundColor: `${colors.success}18`,
          borderRadius: theme.radius.full,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        newText: { fontSize: 10, color: colors.success, ...fontStyle('bold') },
        typeBadge: {
          backgroundColor: `${accent}18`,
          borderRadius: theme.radius.full,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        typeText: { fontSize: 10, color: accent, ...fontStyle('bold') },
        title: {
          fontSize: 17,
          ...fontStyle('extrabold'),
          color: colors.heading,
          lineHeight: 23,
        },
        company: {
          marginTop: 4,
          fontSize: 14,
          ...fontStyle('semibold'),
          color: colors.foreground,
        },
        metaRow: { marginTop: 10, gap: 6 },
        metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        metaText: { fontSize: 13, color: colors.muted, ...fontStyle('medium'), flex: 1 },
        snippet: {
          marginTop: 10,
          fontSize: 13,
          lineHeight: 19,
          color: colors.muted,
          ...fontStyle('regular'),
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
        applyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        applyPill: {
          backgroundColor: colors.blue,
          borderRadius: theme.radius.full,
          paddingHorizontal: 16,
          paddingVertical: 9,
        },
        applyText: { color: '#fff', fontSize: 13, ...fontStyle('bold') },
        posted: { fontSize: 11, ...fontStyle('medium'), color: colors.muted },
        chevron: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, isDark, accent],
  );

  const typeLabel = formatEmploymentType(job.employmentType);
  const experienceLabel =
    job.minExperienceYears != null
      ? job.minExperienceYears === 0
        ? 'Fresher'
        : `${job.minExperienceYears}+ yrs exp`
      : null;
  const snippet = job.description?.replace(/\s+/g, ' ').trim().slice(0, 100);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.accentBar} />
      <View style={styles.body}>
        <View style={styles.badgeRow}>
          {recent ? (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>NEW</Text>
            </View>
          ) : null}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
        </View>

        <View style={styles.topRow}>
          <View style={styles.avatarRing}>
            <CompanyAvatar name={job.companyName} size={48} imageUrl={logoUrl} />
          </View>
          <View style={styles.main}>
            <Text style={styles.title} numberOfLines={2}>
              {job.title}
            </Text>
            <Text style={styles.company} numberOfLines={1}>
              {job.companyName}
            </Text>
          </View>
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
        </View>

        <View style={styles.metaRow}>
          {job.location ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.blue} />
              <Text style={styles.metaText} numberOfLines={1}>
                {job.location}
              </Text>
            </View>
          ) : null}
          {job.salaryRange ? (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={colors.blue} />
              <Text style={styles.metaText} numberOfLines={1}>
                {job.salaryRange}
              </Text>
            </View>
          ) : null}
          {experienceLabel ? (
            <View style={styles.metaItem}>
              <Ionicons name="trending-up-outline" size={14} color={colors.blue} />
              <Text style={styles.metaText} numberOfLines={1}>
                {experienceLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {snippet ? (
          <Text style={styles.snippet} numberOfLines={2}>
            {snippet}
            {job.description.length > 100 ? '…' : ''}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {showApply ? (
            <View style={styles.applyRow}>
              <View style={styles.applyPill}>
                <Text style={styles.applyText}>Apply</Text>
              </View>
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
