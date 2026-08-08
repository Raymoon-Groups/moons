import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmploymentType } from '@moons/shared';
import { CompanyAvatar } from './company-avatar';
import {
  formatEmploymentType,
  formatExperienceLevel,
  formatPostedLabel,
} from '@/lib/format';
import { stripHtml } from '@/lib/html-text';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useSavedJobs } from '@/lib/saved-jobs-context';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

function buildTags(job: JobListing): string[] {
  const tags: string[] = [];
  const level = formatExperienceLevel(job.minExperienceYears, job.maxExperienceYears);
  if (level) tags.push(level);

  if (job.employmentType === EmploymentType.REMOTE) {
    tags.push('Remote');
  } else if (job.location?.trim()) {
    const city = job.location.split(',')[0]?.trim();
    if (city) tags.push(city.length > 14 ? `${city.slice(0, 12)}…` : city);
  }

  const type = formatEmploymentType(job.employmentType);
  if (job.employmentType !== EmploymentType.REMOTE && !tags.includes(type)) {
    tags.push(type);
  } else if (job.employmentType === EmploymentType.REMOTE && tags.length < 3) {
    tags.push('Full-time');
  }

  return tags.slice(0, 3);
}

export function JobCard({
  job,
  onPress,
  showBookmark = false,
}: {
  job: JobListing;
  onPress: () => void;
  /** Candidate browse: show save bookmark affordance. */
  showBookmark?: boolean;
  /** @deprecated Apply CTA removed from card; kept for call-site compatibility. */
  showApply?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const { isSaved, toggle } = useSavedJobs();
  const logoUrl = resolveAssetUrl(job.companyLogoUrl);
  const saved = isSaved(job.id);

  const cardBg = isDark ? colors.surfaceElevated : '#E6F0EC';
  const tagBg = isDark ? colors.surface : '#ffffff';
  const tagText = isDark ? colors.foreground : '#4a5568';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: cardBg,
          borderRadius: 22,
          marginBottom: theme.spacing.md,
          padding: 16,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        },
        pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
        topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
        titleBlock: { flex: 1, minWidth: 0, paddingRight: 4 },
        title: {
          fontSize: 17,
          lineHeight: 22,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        company: {
          marginTop: 3,
          fontSize: 13,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        bookmarkBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -4,
          marginRight: -4,
        },
        tags: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 14,
        },
        tag: {
          backgroundColor: tagBg,
          borderRadius: theme.radius.full,
          paddingHorizontal: 12,
          paddingVertical: 7,
        },
        tagText: {
          fontSize: 12,
          color: tagText,
          ...fontStyle('semibold'),
        },
        snippet: {
          marginTop: 14,
          fontSize: 13,
          lineHeight: 19,
          color: isDark ? colors.muted : '#5a6575',
          ...fontStyle('regular'),
        },
        footer: {
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        },
        salary: {
          flex: 1,
          fontSize: 16,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        posted: {
          fontSize: 12,
          color: colors.muted,
          ...fontStyle('medium'),
        },
      }),
    [cardBg, colors, isDark, tagBg, tagText],
  );

  const tags = buildTags(job);
  const plainDescription = stripHtml(job.description);
  const snippet = plainDescription.replace(/\s+/g, ' ').trim().slice(0, 110);
  const companyLine = [job.companyName, job.location?.split(',')[0]?.trim()]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <CompanyAvatar name={job.companyName} size={48} imageUrl={logoUrl} />
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {companyLine}
          </Text>
        </View>
        {showBookmark ? (
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              // Prevent opening job details when bookmark is pressed.
              e.stopPropagation?.();
              void toggle(job);
            }}
            style={styles.bookmarkBtn}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from saved jobs' : 'Save job'}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? colors.blue : colors.heading}
            />
          </Pressable>
        ) : null}
      </View>

      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag, index) => (
            <View key={`${index}-${tag}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {snippet ? (
        <Text style={styles.snippet} numberOfLines={2}>
          {snippet}
          {plainDescription.length > 110 ? '…' : ''}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.salary} numberOfLines={1}>
          {job.salaryRange?.trim() || 'Salary not listed'}
        </Text>
        <Text style={styles.posted}>{formatPostedLabel(job.createdAt)}</Text>
      </View>
    </Pressable>
  );
}
