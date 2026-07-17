import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking as RNLinking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApplicationStatus } from '@moons/shared';
import { CoverNoteBlock, ScreeningAnswersList } from '@/components/jobs/screening-answers-list';
import { SelectField } from '@/components/profile/select-field';
import { EmptyState, FilterChips, ScreenHeader } from '@/components/portal-ui';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { authFetch } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import {
  buildRecruiterCandidatesUrl,
  EXPERIENCE_BUCKETS,
  NOTICE_OPTIONS,
  type RecruiterCandidateRow,
} from '@/lib/recruiter-candidates';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: ApplicationStatus.SUBMITTED },
  { label: 'Viewed', value: ApplicationStatus.VIEWED },
  { label: 'Shortlisted', value: ApplicationStatus.SHORTLISTED },
  { label: 'Rejected', value: ApplicationStatus.REJECTED },
];

function formatExperience(years: number | null | undefined) {
  if (years == null) return null;
  if (years === 0) return 'Fresher';
  return years === 1 ? '1 year' : `${years} years`;
}

function CandidateCard({
  row,
  keyword,
  phoneRevealed,
  onRevealPhone,
  updating,
  onStatusChange,
}: {
  row: RecruiterCandidateRow;
  keyword: string;
  phoneRevealed: boolean;
  onRevealPhone: () => void;
  updating: boolean;
  onStatusChange: (status: ApplicationStatus) => void;
}) {
  const { colors } = useTheme();
  const profile = row.candidate.profile;
  const name = profile?.fullName ?? row.candidate.email;
  const avatar = resolveAssetUrl(profile?.avatarUrl);
  const skills = profile?.skills ?? [];
  const q = keyword.trim().toLowerCase();

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
        },
        top: { flexDirection: 'row', gap: 12, padding: theme.spacing.md },
        avatar: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: '100%', height: '100%' },
        name: { fontSize: 16, color: colors.heading, ...fontStyle('bold') },
        meta: { marginTop: 4, fontSize: 13, color: colors.muted, ...fontStyle('regular') },
        jobLine: { marginTop: 8, fontSize: 12, color: colors.blue, ...fontStyle('semibold') },
        skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: theme.spacing.md, paddingBottom: 8 },
        skill: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: colors.surface,
        },
        skillMatch: { backgroundColor: 'rgba(251,191,36,0.2)' },
        skillText: { fontSize: 11, color: colors.muted, ...fontStyle('medium') },
        actions: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          padding: theme.spacing.md,
          gap: 8,
        },
        actionBtn: {
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 10,
          alignItems: 'center',
          backgroundColor: colors.surface,
        },
        actionBtnPrimary: {
          backgroundColor: colors.blue,
          borderColor: colors.blue,
        },
        actionText: { fontSize: 14, color: colors.heading, ...fontStyle('semibold') },
        actionTextPrimary: { color: '#fff' },
        coverNote: {
          marginHorizontal: theme.spacing.md,
          marginBottom: 8,
          padding: 10,
          borderRadius: theme.radius.md,
          backgroundColor: colors.surface,
        },
        coverNoteLabel: { fontSize: 11, color: colors.muted, ...fontStyle('bold') },
        coverNoteText: { marginTop: 4, fontSize: 13, color: colors.foreground, lineHeight: 20 },
      }),
    [colors],
  );

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 20, color: colors.heading, ...fontStyle('bold') }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <StatusBadge status={row.status} />
          <Text style={styles.name}>{name}</Text>
          {profile?.headline ? <Text style={styles.meta}>{profile.headline}</Text> : null}
          {profile?.location ? <Text style={styles.meta}>{profile.location}</Text> : null}
          {formatExperience(profile?.experienceYears) ? (
            <Text style={styles.meta}>{formatExperience(profile?.experienceYears)}</Text>
          ) : null}
          <Text style={styles.jobLine}>
            {row.job.title} · {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      {row.coverNote ? <CoverNoteBlock note={row.coverNote} style={{ marginTop: 10 }} /> : null}
      <ScreeningAnswersList answers={row.screeningAnswers} style={{ marginTop: 10 }} />

      {skills.length > 0 ? (
        <View style={styles.skills}>
          {skills.slice(0, 6).map((skill) => {
            const match = q && skill.toLowerCase().includes(q);
            return (
              <View key={skill} style={[styles.skill, match && styles.skillMatch]}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.actions}>
        {profile?.phone ? (
          phoneRevealed ? (
            <Pressable
              onPress={() => void RNLinking.openURL(`tel:${profile.phone}`)}
              style={[styles.actionBtn, styles.actionBtnPrimary]}
            >
              <Text style={[styles.actionText, styles.actionTextPrimary]}>{profile.phone}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onRevealPhone} style={styles.actionBtn}>
              <Text style={styles.actionText}>View phone number</Text>
            </Pressable>
          )
        ) : (
          <Text style={[styles.meta, { textAlign: 'center' }]}>Phone not provided</Text>
        )}

        <Pressable
          onPress={() => router.push(`/recruiter/candidates/${row.candidate.id}`)}
          style={[styles.actionBtn, styles.actionBtnPrimary]}
        >
          <Text style={[styles.actionText, styles.actionTextPrimary]}>View full profile</Text>
        </Pressable>

        {profile?.resumeUrl ? (
          <Pressable
            onPress={() => void Linking.openURL(resolveAssetUrl(profile.resumeUrl)!)}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>Download CV</Text>
          </Pressable>
        ) : null}

        <SelectField
          label="Application status"
          value={row.status}
          options={STATUS_FILTERS.filter((s) => s.value !== 'all').map((s) => ({
            label: s.label,
            value: s.value,
          }))}
          onChange={(value) => onStatusChange(value as ApplicationStatus)}
        />
        {updating ? <Text style={styles.meta}>Updating status…</Text> : null}
      </View>
    </View>
  );
}

export function RecruiterCandidatesScreen({ showHeader = true }: { showHeader?: boolean }) {
  const { colors } = useTheme();
  const [rows, setRows] = useState<RecruiterCandidateRow[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [locationQ, setLocationQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [noticeFilter, setNoticeFilter] = useState('');
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const experienceBucket = EXPERIENCE_BUCKETS.find((b) => b.value === experienceFilter);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const url = buildRecruiterCandidatesUrl({
        q: searchQ || undefined,
        location: locationQ || undefined,
        status: statusFilter !== 'all' ? (statusFilter as ApplicationStatus) : undefined,
        jobId: jobFilter || undefined,
        experienceMin: experienceBucket?.min,
        experienceMax: experienceBucket?.max,
        noticePeriod: noticeFilter || undefined,
      });
      const data = await authFetch<RecruiterCandidateRow[]>(url);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQ, locationQ, statusFilter, jobFilter, experienceBucket, noticeFilter]);

  useEffect(() => {
    authFetch<JobListing[]>('/jobs/mine')
      .then(setJobs)
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    try {
      await authFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRows((prev) => prev.map((r) => (r.id === applicationId ? { ...r, status } : r)));
    } finally {
      setUpdatingId(null);
    }
  }

  const header = useMemo(
    () => (
      <View>
        {showHeader ? (
          <ScreenHeader
            title="Candidates"
            subtitle="Search and manage applicants across your open roles."
          />
        ) : null}
        <SearchBar value={searchQ} onChangeText={setSearchQ} placeholder="Name, skills, or role…" />
        <SearchBar value={locationQ} onChangeText={setLocationQ} placeholder="Location…" />
        <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <SelectField
          label="Job"
          value={jobFilter}
          options={[{ label: 'All jobs', value: '' }, ...jobs.map((j) => ({ label: j.title, value: j.id }))]}
          onChange={setJobFilter}
          placeholder="All jobs"
        />
        <SelectField
          label="Experience"
          value={experienceFilter}
          options={EXPERIENCE_BUCKETS.map((b) => ({ label: b.label, value: b.value }))}
          onChange={setExperienceFilter}
        />
        <SelectField
          label="Notice period"
          value={noticeFilter}
          options={[{ label: 'Any', value: '' }, ...NOTICE_OPTIONS.map((n) => ({ label: n, value: n }))]}
          onChange={setNoticeFilter}
        />
      </View>
    ),
    [showHeader, searchQ, locationQ, statusFilter, jobFilter, experienceFilter, noticeFilter, jobs],
  );

  if (loading && rows.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.muted }}>Loading candidates…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState icon="people-outline" title="No candidates found" message="Try adjusting your filters." />
      }
      renderItem={({ item }) => (
        <CandidateCard
          row={item}
          keyword={searchQ}
          phoneRevealed={revealedPhones.has(item.candidate.id)}
          onRevealPhone={() =>
            setRevealedPhones((prev) => new Set(prev).add(item.candidate.id))
          }
          updating={updatingId === item.id}
          onStatusChange={(status) => void updateStatus(item.id, status)}
        />
      )}
    />
  );
}
