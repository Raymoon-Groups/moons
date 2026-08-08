import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CompanyAvatar } from '@/components/company-avatar';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { CompanyListing } from '@/lib/types';

function buildTags(company: CompanyListing): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string | null, max = 18) => {
    const value = raw?.trim();
    if (!value) return;
    const label = value.length > max ? `${value.slice(0, max - 2)}…` : value;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(label);
  };
  push(company.companyType);
  push(company.industry);
  return tags.slice(0, 2);
}

export function CompanyListingCard({
  company,
  onPress,
}: {
  company: CompanyListing;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const logoUrl = resolveAssetUrl(company.companyLogoUrl);
  const activelyHiring = company.openJobs >= 3;
  const tags = buildTags(company);
  const location = company.location?.trim();
  const summary =
    company.companySummary?.replace(/\s+/g, ' ').trim() ||
    (company.openJobs > 0
      ? `Hiring for ${company.openJobs} open role${company.openJobs === 1 ? '' : 's'}${location ? ` in ${location}` : ''}.`
      : null);

  const cardBg = isDark ? colors.surfaceElevated : '#E8EEF6';
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
        meta: {
          marginTop: 4,
          fontSize: 13,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        metaRow: {
          marginTop: 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        hireBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          borderRadius: theme.radius.full,
          backgroundColor: isDark ? `${colors.success}22` : '#dcfce7',
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        hireText: {
          fontSize: 11,
          color: isDark ? colors.success : '#15803d',
          ...fontStyle('bold'),
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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        jobsLabel: {
          flex: 1,
          fontSize: 15,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        chevron: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.85)',
        },
      }),
    [cardBg, colors, isDark, tagBg, tagText],
  );

  const metaBits = [company.companySize, location].filter(Boolean).join(' · ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <CompanyAvatar name={company.companyName} size={52} imageUrl={logoUrl} />
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {company.companyName}
          </Text>
          {metaBits ? (
            <View style={styles.metaRow}>
              {location ? <Ionicons name="location-outline" size={13} color={colors.muted} /> : null}
              <Text style={[styles.meta, { marginTop: 0, flex: 1 }]} numberOfLines={1}>
                {metaBits}
              </Text>
            </View>
          ) : null}
        </View>
        {activelyHiring ? (
          <View style={styles.hireBadge}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isDark ? colors.success : '#15803d',
              }}
            />
            <Text style={styles.hireText}>Hiring</Text>
          </View>
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

      {summary ? (
        <Text style={styles.snippet} numberOfLines={2}>
          {summary.length > 120 ? `${summary.slice(0, 118)}…` : summary}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.jobsLabel} numberOfLines={1}>
          {company.openJobs > 0
            ? `${company.openJobs} open role${company.openJobs === 1 ? '' : 's'}`
            : 'No open roles right now'}
        </Text>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={16} color={colors.blue} />
        </View>
      </View>
    </Pressable>
  );
}
