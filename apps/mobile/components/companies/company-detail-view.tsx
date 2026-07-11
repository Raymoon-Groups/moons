import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmploymentType } from '@moons/shared';
import { CompanyAvatar } from '@/components/company-avatar';
import { EmptyState, PortalCard, SectionTitle } from '@/components/portal-ui';
import { Chip } from '@/components/status-badge';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { formatEmploymentType } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { PublicCompanyProfile } from '@/lib/types';

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

function StatTile({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        statStyles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={16} color={colors.blue} />
      <Text style={[statStyles.value, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[statStyles.label, { color: colors.muted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  value: { fontSize: 14, textAlign: 'center' },
  label: { fontSize: 10, textAlign: 'center', ...fontStyle('semibold') },
});

function DetailCell({ label, value, fullWidth }: { label: string; value?: string | null; fullWidth?: boolean }) {
  const { colors } = useTheme();
  if (!value?.trim()) return null;

  return (
    <View
      style={[
        detailStyles.cell,
        fullWidth && detailStyles.cellFull,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[detailStyles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  cell: {
    width: '48%',
    flexGrow: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 12,
  },
  cellFull: {
    width: '100%',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    ...fontStyle('bold'),
  },
  value: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    ...fontStyle('semibold'),
  },
});

function OpenJobCard({
  job,
  onPress,
}: {
  job: PublicCompanyProfile['openJobs'][number];
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const accent = employmentAccent(job.employmentType, colors);
  const typeLabel = formatEmploymentType(job.employmentType);
  const meta = [job.location, job.salaryRange].filter(Boolean).join(' · ');

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
        accent: { width: 4, backgroundColor: accent },
        body: { flex: 1, padding: theme.spacing.md },
        row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
        badge: {
          alignSelf: 'flex-start',
          backgroundColor: `${accent}18`,
          borderRadius: theme.radius.full,
          paddingHorizontal: 8,
          paddingVertical: 3,
          marginBottom: 8,
        },
        badgeText: { fontSize: 10, color: accent, ...fontStyle('bold') },
        title: { fontSize: 16, color: colors.heading, ...fontStyle('extrabold'), flex: 1 },
        meta: { marginTop: 6, fontSize: 13, color: colors.muted, ...fontStyle('medium') },
        chevron: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, accent],
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{typeLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
        </View>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}

export function CompanyDetailView({ company }: { company: PublicCompanyProfile }) {
  const { colors, isDark } = useTheme();
  const name = company.companyName?.trim() || 'Company';
  const logoUrl = resolveAssetUrl(company.companyLogoUrl);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        heroWrap: {
          marginHorizontal: -theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        heroGradient: {
          paddingTop: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
          backgroundColor: isDark ? `${colors.blue}14` : `${colors.blue}0c`,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        heroCard: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.lg,
          ...theme.shadow.card,
        },
        eyebrow: {
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.blue,
          marginBottom: 10,
          ...fontStyle('bold'),
        },
        heroRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
        heroMain: { flex: 1, minWidth: 0 },
        title: {
          fontSize: 22,
          lineHeight: 28,
          color: colors.heading,
          ...fontStyle('extrabold'),
        },
        subtitle: {
          marginTop: 6,
          fontSize: 14,
          lineHeight: 20,
          color: colors.muted,
          ...fontStyle('regular'),
        },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        statsRow: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.md },
        aboutBody: { padding: theme.spacing.lg },
        aboutTitle: {
          fontSize: 16,
          color: colors.heading,
          marginBottom: 12,
          ...fontStyle('extrabold'),
        },
        summary: {
          fontSize: 15,
          lineHeight: 24,
          color: colors.foreground,
          marginBottom: theme.spacing.md,
          ...fontStyle('regular'),
        },
        detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
        websiteBtn: {
          marginTop: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: `${colors.blue}44`,
          backgroundColor: `${colors.blue}10`,
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
        websiteText: { fontSize: 14, color: colors.blue, ...fontStyle('bold') },
        jobsHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        jobsCount: { fontSize: 13, color: colors.blue, ...fontStyle('bold') },
      }),
    [colors, isDark],
  );

  async function openWebsite() {
    if (!company.companyWebsite) return;
    const href = company.companyWebsite.startsWith('http')
      ? company.companyWebsite
      : `https://${company.companyWebsite}`;
    await Linking.openURL(href).catch(() => undefined);
  }

  const subtitle = [company.industry, company.companyType].filter(Boolean).join(' · ');
  const hasAbout =
    company.companySummary ||
    company.companySize ||
    company.companyLocation ||
    company.officeAddress;

  return (
    <View>
      <View style={styles.heroWrap}>
        <LinearGradient
          colors={
            isDark
              ? [`${colors.blue}20`, `${colors.blue}08`, 'transparent']
              : [`${colors.blue}14`, `${colors.blue}06`, 'transparent']
          }
          style={styles.heroGradient}
        >
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Company profile</Text>
            <View style={styles.heroRow}>
              <CompanyAvatar name={name} size={64} imageUrl={logoUrl} />
              <View style={styles.heroMain}>
                <Text style={styles.title}>{name}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                <View style={styles.chipRow}>
                  {company.openJobsCount >= 3 ? <Chip label="Actively hiring" /> : null}
                  {company.industry ? <Chip label={company.industry} /> : null}
                  {company.companyType ? <Chip label={company.companyType} /> : null}
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatTile
                icon="briefcase-outline"
                value={String(company.openJobsCount)}
                label="Open jobs"
              />
              {company.companySize ? (
                <StatTile icon="people-outline" value={company.companySize} label="Team size" />
              ) : null}
              {company.companyLocation ? (
                <StatTile icon="location-outline" value={company.companyLocation} label="Head office" />
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </View>

      {hasAbout ? (
        <PortalCard accent>
          <View style={styles.aboutBody}>
            <Text style={styles.aboutTitle}>About the company</Text>
            {company.companySummary ? (
              <Text style={styles.summary}>{company.companySummary}</Text>
            ) : null}
            <View style={styles.detailGrid}>
              <DetailCell label="Company size" value={company.companySize} />
              <DetailCell label="Head office" value={company.companyLocation} />
              <DetailCell label="Office address" value={company.officeAddress} fullWidth />
            </View>
            {company.companyWebsite ? (
              <Pressable onPress={() => void openWebsite()} style={styles.websiteBtn}>
                <Ionicons name="globe-outline" size={18} color={colors.blue} />
                <Text style={styles.websiteText} numberOfLines={1}>
                  Visit website
                </Text>
              </Pressable>
            ) : null}
          </View>
        </PortalCard>
      ) : null}

      <View style={styles.jobsHeader}>
        <SectionTitle>Open positions</SectionTitle>
        {company.openJobsCount > 0 ? (
          <Text style={styles.jobsCount}>{company.openJobsCount} roles</Text>
        ) : null}
      </View>

      {company.openJobs.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title="No open roles"
          message="This company has no active listings right now. Check back later."
        />
      ) : (
        company.openJobs.map((job) => (
          <OpenJobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />
        ))
      )}
    </View>
  );
}
