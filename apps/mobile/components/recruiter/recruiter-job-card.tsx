import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CompanyAvatar } from '@/components/company-avatar';
import { formatEmploymentType, formatPostedLabel } from '@/lib/format';
import { stripHtml } from '@/lib/html-text';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

function JobStatusPill({ status }: { status: string }) {
  const { colors, isDark } = useTheme();
  const isLive = status === 'PUBLISHED';
  const isClosed = status === 'CLOSED';

  const bg = isLive
    ? isDark
      ? 'rgba(16,185,129,0.16)'
      : '#ecfdf5'
    : isClosed
      ? isDark
        ? 'rgba(245,158,11,0.16)'
        : '#fffbeb'
      : isDark
        ? colors.surface
        : '#f1f5f9';
  const fg = isLive ? (isDark ? '#6ee7b7' : '#047857') : isClosed ? (isDark ? '#fcd34d' : '#b45309') : colors.muted;
  const label = isLive ? 'Live' : status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      {isLive ? <View style={[styles.liveDot, { backgroundColor: '#10b981' }]} /> : null}
      <Text style={[styles.statusText, { color: fg }, fontStyle('bold')]}>{label}</Text>
    </View>
  );
}

export function RecruiterJobCard({
  job,
  onOpen,
  onApplicants,
  onEdit,
  onClose,
}: {
  job: JobListing;
  onOpen: () => void;
  onApplicants: () => void;
  onEdit: () => void;
  onClose?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const logoUrl = resolveAssetUrl(job.companyLogoUrl ?? null);
  const plain = stripHtml(job.description).replace(/\s+/g, ' ').trim();
  const snippet = plain.slice(0, 120);
  const accent =
    job.status === 'PUBLISHED' ? '#10b981' : job.status === 'CLOSED' ? '#f59e0b' : colors.blue;

  const cardStyles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
          marginBottom: 14,
          ...theme.shadow.soft,
        },
        accent: { height: 3, backgroundColor: accent },
        body: { padding: 16 },
        top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
        meta: { flex: 1, minWidth: 0 },
        title: { fontSize: 17, lineHeight: 22, color: colors.heading, ...fontStyle('bold') },
        company: { marginTop: 4, fontSize: 13, color: colors.muted, ...fontStyle('medium') },
        pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        chip: {
          borderRadius: 999,
          paddingHorizontal: 11,
          paddingVertical: 6,
          backgroundColor: isDark ? colors.surface : '#f1f5f9',
        },
        chipText: { fontSize: 12, color: colors.muted, ...fontStyle('semibold') },
        snippet: {
          marginTop: 12,
          fontSize: 13,
          lineHeight: 19,
          color: isDark ? colors.muted : '#5a6575',
          ...fontStyle('regular'),
        },
        footer: {
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        },
        salary: { flex: 1, fontSize: 15, color: colors.heading, ...fontStyle('bold') },
        posted: { fontSize: 12, color: colors.muted, ...fontStyle('medium') },
        actions: {
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? colors.border : 'rgba(15,28,51,0.08)',
          flexDirection: 'row',
          gap: 8,
        },
        actionBtn: {
          flex: 1,
          minHeight: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 5,
          paddingHorizontal: 8,
        },
        primaryAction: {
          backgroundColor: colors.blue,
        },
        secondaryAction: {
          backgroundColor: isDark ? colors.surface : '#eef3fb',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(63,116,204,0.14)',
        },
        dangerAction: {
          backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(239,68,68,0.28)' : 'rgba(239,68,68,0.18)',
        },
        primaryActionText: { color: '#fff', fontSize: 12, ...fontStyle('bold') },
        secondaryActionText: { color: colors.heading, fontSize: 12, ...fontStyle('bold') },
        dangerActionText: { color: colors.error, fontSize: 12, ...fontStyle('bold') },
      }),
    [accent, colors, isDark],
  );

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [cardStyles.card, pressed && { opacity: 0.96, transform: [{ scale: 0.995 }] }]}
    >
      <View style={cardStyles.accent} />
      <View style={cardStyles.body}>
        <View style={cardStyles.top}>
          <CompanyAvatar name={job.companyName} size={52} imageUrl={logoUrl} />
          <View style={cardStyles.meta}>
            <JobStatusPill status={job.status} />
            <Text style={cardStyles.title} numberOfLines={2}>
              {job.title}
            </Text>
            <Text style={cardStyles.company} numberOfLines={1}>
              {[job.companyName, job.location?.split(',')[0]?.trim()].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        <View style={cardStyles.pills}>
          <View style={cardStyles.chip}>
            <Text style={cardStyles.chipText}>{formatEmploymentType(job.employmentType)}</Text>
          </View>
          {job.location?.trim() ? (
            <View style={cardStyles.chip}>
              <Text style={cardStyles.chipText}>{job.location.split(',')[0]?.trim()}</Text>
            </View>
          ) : null}
        </View>

        {snippet ? (
          <Text style={cardStyles.snippet} numberOfLines={2}>
            {snippet}
            {plain.length > 120 ? '…' : ''}
          </Text>
        ) : null}

        <View style={cardStyles.footer}>
          <Text style={cardStyles.salary} numberOfLines={1}>
            {job.salaryRange?.trim() || 'Salary not listed'}
          </Text>
          <Text style={cardStyles.posted}>{formatPostedLabel(job.createdAt)}</Text>
        </View>

        <View style={cardStyles.actions}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onApplicants();
            }}
            style={[cardStyles.actionBtn, cardStyles.primaryAction]}
            accessibilityRole="button"
            accessibilityLabel="View applicants"
          >
            <Ionicons name="people-outline" size={15} color="#fff" />
            <Text style={cardStyles.primaryActionText}>Applicants</Text>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onEdit();
            }}
            style={[cardStyles.actionBtn, cardStyles.secondaryAction]}
            accessibilityRole="button"
            accessibilityLabel="Edit job"
          >
            <Ionicons name="create-outline" size={15} color={colors.heading} />
            <Text style={cardStyles.secondaryActionText}>Edit</Text>
          </Pressable>
          {job.status === 'PUBLISHED' && onClose ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onClose();
              }}
              style={[cardStyles.actionBtn, cardStyles.dangerAction]}
              accessibilityRole="button"
              accessibilityLabel="Close job"
            >
              <Text style={cardStyles.dangerActionText}>Close</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
