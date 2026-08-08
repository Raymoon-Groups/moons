import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ReactNode, useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { EmploymentType } from '@moons/shared';
import { CompanyAvatar } from '@/components/company-avatar';
import { EmptyState } from '@/components/portal-ui';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { formatEmploymentType, formatPostedLabel } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { PublicCompanyProfile } from '@/lib/types';

type CompanyOpenJob = PublicCompanyProfile['openJobs'][number];

function buildJobTags(job: CompanyOpenJob): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string | null) => {
    const value = raw?.trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(value);
  };

  if (job.employmentType === EmploymentType.REMOTE) {
    push('Remote');
    push('Full-time');
  } else {
    if (job.location?.trim()) {
      const city = job.location.split(',')[0]?.trim();
      if (city) push(city.length > 14 ? `${city.slice(0, 12)}…` : city);
    }
    push(formatEmploymentType(job.employmentType));
  }

  return tags.slice(0, 3);
}

function SoftCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { colors, isDark } = useTheme();
  const bg = isDark ? colors.surfaceElevated : '#E8EEF6';
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: 22,
          padding: 16,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          marginBottom: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function OpenJobCard({
  job,
  companyName,
  logoUrl,
  onPress,
}: {
  job: CompanyOpenJob;
  companyName: string;
  logoUrl: string | null;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  // Match Jobs tab card surface (mint soft card).
  const cardBg = isDark ? colors.surfaceElevated : '#E6F0EC';
  const tagBg = isDark ? colors.surface : '#ffffff';
  const tagText = isDark ? colors.foreground : '#4a5568';
  const tags = buildJobTags(job);
  const city = job.location?.split(',')[0]?.trim();
  const companyLine = [companyName, city].filter(Boolean).join(' · ');
  const posted = job.createdAt ? formatPostedLabel(job.createdAt) : 'Open role';

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
        arrowBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -2,
          backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.7)',
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
        metaRow: {
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        metaText: {
          flex: 1,
          fontSize: 13,
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

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <CompanyAvatar name={companyName} size={48} imageUrl={logoUrl} />
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {companyLine}
          </Text>
        </View>
        <View style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.blue} />
        </View>
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

      {job.location?.trim() ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {job.location.trim()}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.salary} numberOfLines={1}>
          {job.salaryRange?.trim() || 'Salary not listed'}
        </Text>
        <Text style={styles.posted}>{posted}</Text>
      </View>
    </Pressable>
  );
}

export function CompanyDetailView({ company }: { company: PublicCompanyProfile }) {
  const { colors, isDark } = useTheme();
  const name = company.companyName?.trim() || 'Company';
  const logoUrl = resolveAssetUrl(company.companyLogoUrl);
  const activelyHiring = company.openJobsCount >= 3;
  const location = company.companyLocation?.trim();
  const aboutBg = isDark ? colors.surfaceElevated : '#ffffff';
  const tagBg = isDark ? colors.surface : '#ffffff';
  const tagText = isDark ? colors.foreground : '#4a5568';
  const statBg = isDark ? colors.surface : '#ffffff';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        hero: {
          backgroundColor: isDark ? colors.surfaceElevated : '#E8EEF6',
          borderRadius: 22,
          padding: 18,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          marginBottom: theme.spacing.md,
        },
        heroTop: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 14,
        },
        heroMain: { flex: 1, minWidth: 0 },
        title: {
          fontSize: 22,
          lineHeight: 28,
          color: colors.heading,
          ...fontStyle('extrabold'),
        },
        metaRow: {
          marginTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        meta: {
          flex: 1,
          fontSize: 13,
          color: colors.muted,
          ...fontStyle('medium'),
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
        statsRow: {
          flexDirection: 'row',
          gap: 8,
          marginTop: 16,
        },
        statCard: {
          flex: 1,
          minWidth: 0,
          borderRadius: 14,
          backgroundColor: statBg,
          paddingVertical: 12,
          paddingHorizontal: 8,
          alignItems: 'center',
          gap: 4,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
        },
        statValue: {
          fontSize: 15,
          color: colors.heading,
          textAlign: 'center',
          ...fontStyle('bold'),
        },
        statLabel: {
          fontSize: 10,
          color: colors.muted,
          textAlign: 'center',
          ...fontStyle('semibold'),
        },
        aboutCard: {
          backgroundColor: aboutBg,
          borderRadius: 22,
          padding: 18,
          marginBottom: theme.spacing.md,
          borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
        },
        sectionLabel: {
          fontSize: 12,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.muted,
          marginBottom: 12,
          ...fontStyle('bold'),
        },
        summary: {
          fontSize: 15,
          lineHeight: 23,
          color: isDark ? colors.foreground : '#3d4a5c',
          ...fontStyle('regular'),
        },
        detailList: {
          marginTop: 16,
          gap: 10,
        },
        detailRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          backgroundColor: isDark ? colors.surface : '#f4f7fb',
          borderRadius: 14,
          padding: 12,
        },
        detailIcon: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
        },
        detailLabel: {
          fontSize: 11,
          color: colors.muted,
          ...fontStyle('semibold'),
        },
        detailValue: {
          marginTop: 2,
          fontSize: 14,
          color: colors.heading,
          lineHeight: 19,
          ...fontStyle('semibold'),
        },
        websiteBtn: {
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: theme.radius.full,
          backgroundColor: colors.blue,
          paddingVertical: 14,
          paddingHorizontal: 16,
        },
        websiteText: {
          fontSize: 15,
          color: '#fff',
          ...fontStyle('bold'),
        },
        jobsHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          marginTop: 4,
        },
        jobsTitleBlock: { flex: 1, minWidth: 0, gap: 2 },
        jobsTitle: {
          fontSize: 17,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        jobsSubtitle: {
          fontSize: 13,
          color: colors.muted,
          ...fontStyle('medium'),
        },
        jobsCountPill: {
          borderRadius: theme.radius.full,
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        jobsCount: {
          fontSize: 13,
          color: colors.blue,
          ...fontStyle('bold'),
        },
      }),
    [aboutBg, colors, isDark, statBg, tagBg, tagText],
  );

  async function openWebsite() {
    if (!company.companyWebsite) return;
    const href = company.companyWebsite.startsWith('http')
      ? company.companyWebsite
      : `https://${company.companyWebsite}`;
    await Linking.openURL(href).catch(() => undefined);
  }

  const tags = Array.from(
    new Set(
      [company.companyType, company.industry]
        .map((t) => t?.trim())
        .filter((t): t is string => Boolean(t)),
    ),
  );
  const metaBits = [company.companySize, location].filter(Boolean).join(' · ');

  const hasAbout =
    Boolean(company.companySummary?.trim()) ||
    Boolean(company.companySize) ||
    Boolean(location) ||
    Boolean(company.officeAddress) ||
    Boolean(company.companyWebsite);

  const detailRows: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }[] = [];
  if (company.companySize) {
    detailRows.push({ icon: 'people-outline', label: 'Company size', value: company.companySize });
  }
  if (location) {
    detailRows.push({ icon: 'location-outline', label: 'Head office', value: location });
  }
  if (company.officeAddress?.trim()) {
    detailRows.push({
      icon: 'business-outline',
      label: 'Office address',
      value: company.officeAddress.trim(),
    });
  }

  return (
    <View style={styles.root}>
      <SoftCard style={styles.hero}>
        <View style={styles.heroTop}>
          <CompanyAvatar name={name} size={64} imageUrl={logoUrl} />
          <View style={styles.heroMain}>
            <Text style={styles.title}>{name}</Text>
            {metaBits ? (
              <View style={styles.metaRow}>
                {location ? <Ionicons name="location-outline" size={13} color={colors.muted} /> : null}
                <Text style={styles.meta} numberOfLines={2}>
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="briefcase-outline" size={16} color={colors.blue} />
            <Text style={styles.statValue} numberOfLines={1}>
              {company.openJobsCount}
            </Text>
            <Text style={styles.statLabel}>Open roles</Text>
          </View>
          {company.companySize ? (
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={16} color={colors.blue} />
              <Text style={styles.statValue} numberOfLines={1}>
                {company.companySize}
              </Text>
              <Text style={styles.statLabel}>Team size</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.statCard}>
              <Ionicons name="location-outline" size={16} color={colors.blue} />
              <Text style={styles.statValue} numberOfLines={1}>
                {location.split(',')[0]?.trim() || location}
              </Text>
              <Text style={styles.statLabel}>Location</Text>
            </View>
          ) : null}
        </View>
      </SoftCard>

      {hasAbout ? (
        <View style={styles.aboutCard}>
          <Text style={styles.sectionLabel}>About company</Text>
          {company.companySummary?.trim() ? (
            <Text style={styles.summary}>{company.companySummary.trim()}</Text>
          ) : (
            <Text style={styles.summary}>
              {company.openJobsCount > 0
                ? `Currently hiring for ${company.openJobsCount} open role${company.openJobsCount === 1 ? '' : 's'} on MoonsJob.`
                : 'Explore this employer profile and check back for new openings.'}
            </Text>
          )}

          {detailRows.length > 0 ? (
            <View style={styles.detailList}>
              {detailRows.map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name={row.icon} size={16} color={colors.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {company.companyWebsite ? (
            <Pressable
              onPress={() => void openWebsite()}
              style={({ pressed }) => [styles.websiteBtn, pressed && { opacity: 0.92 }]}
            >
              <Ionicons name="globe-outline" size={18} color="#fff" />
              <Text style={styles.websiteText} numberOfLines={1}>
                Visit website
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.jobsHeader}>
        <View style={styles.jobsTitleBlock}>
          <Text style={styles.jobsTitle}>Open positions</Text>
          <Text style={styles.jobsSubtitle}>
            {company.openJobs.length > 0
              ? 'Tap a role to view details and apply'
              : 'No published openings right now'}
          </Text>
        </View>
        {company.openJobsCount > 0 ? (
          <View style={styles.jobsCountPill}>
            <Text style={styles.jobsCount}>
              {company.openJobsCount} role{company.openJobsCount === 1 ? '' : 's'}
            </Text>
          </View>
        ) : null}
      </View>

      {company.openJobs.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title="No open roles"
          message="This company has no active listings right now. Check back later."
        />
      ) : (
        company.openJobs.map((job, index) => (
          <OpenJobCard
            key={job.id || `open-job-${index}`}
            job={job}
            companyName={name}
            logoUrl={logoUrl}
            onPress={() => router.push(`/job/${job.id}`)}
          />
        ))
      )}
    </View>
  );
}
