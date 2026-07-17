import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApplicationStatus } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { CompanyAvatar } from '@/components/company-avatar';
import { CoverNoteBlock, ScreeningAnswersList } from '@/components/jobs/screening-answers-list';
import { LoadingScreen } from '@/components/loading-screen';
import { StatusBadge } from '@/components/status-badge';
import { authFetch } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { formatRecruiterApplicationStatus } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { ApplicantRow, JobListing } from '@/lib/types';

const STATUS_OPTIONS = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.VIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.REJECTED,
] as const;

function formatExperience(years: number | null | undefined) {
  if (years == null) return null;
  if (years === 0) return 'Fresher';
  return years === 1 ? '1 yr exp' : `${years} yrs exp`;
}

export default function ApplicantsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobListing | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const countBy = (status: ApplicationStatus) =>
      applicants.filter((a) => a.status === status).length;
    return {
      total: applicants.length,
      new: countBy(ApplicationStatus.SUBMITTED),
      viewed: countBy(ApplicationStatus.VIEWED),
      shortlisted: countBy(ApplicationStatus.SHORTLISTED),
      rejected: countBy(ApplicationStatus.REJECTED),
    };
  }, [applicants]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { padding: theme.spacing.md, paddingBottom: 32 },
        empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
        header: { marginBottom: theme.spacing.md },
        jobTitle: { fontSize: 18, fontFamily: theme.fonts.bold, color: colors.heading },
        jobMeta: { marginTop: 4, fontSize: 13, fontFamily: theme.fonts.regular, color: colors.muted },
        statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        statChip: {
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        statLabel: { fontSize: 10, fontFamily: theme.fonts.medium, color: colors.muted },
        statValue: { fontSize: 13, fontFamily: theme.fonts.bold, color: colors.heading, marginTop: 1 },
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        row: { flexDirection: 'row', gap: 12 },
        name: { marginTop: 6, fontSize: 16, fontFamily: theme.fonts.bold, color: colors.heading },
        meta: { marginTop: 4, fontSize: 13, fontFamily: theme.fonts.regular, color: colors.muted },
        applied: { marginTop: 6, fontSize: 12, fontFamily: theme.fonts.medium, color: colors.muted },
        skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
        skill: {
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        skillText: { fontSize: 11, color: colors.foreground, fontFamily: theme.fonts.medium },
        profileLink: { marginTop: 10 },
        profileLinkText: { color: colors.blue, fontFamily: theme.fonts.semibold, fontSize: 13 },
        resumeLink: { marginTop: 6 },
        resumeLinkText: { color: colors.blue, fontFamily: theme.fonts.semibold, fontSize: 12 },
        actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        chip: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.full,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        chipActive: { borderColor: colors.blue, backgroundColor: colors.surface },
        chipText: { fontSize: 11, color: colors.foreground, fontFamily: theme.fonts.semibold },
      }),
    [colors],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [jobData, applicantData] = await Promise.all([
        authFetch<JobListing>(`/jobs/mine/${id}`).catch(() => null),
        authFetch<ApplicantRow[]>(`/applications/job/${id}`),
      ]);
      setJob(jobData);
      setApplicants(applicantData);
    } catch {
      setJob(null);
      setApplicants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    try {
      await authFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppScreen>
      <FlatList
        data={applicants}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListHeaderComponent={
          <>
            {job ? (
              <View style={styles.header}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobMeta}>
                  {[job.companyName, job.location].filter(Boolean).join(' · ')}
                </Text>
                {applicants.length > 0 ? (
                  <View style={styles.statsRow}>
                    {[
                      { label: 'Total', value: stats.total },
                      { label: 'New', value: stats.new },
                      { label: 'Viewed', value: stats.viewed },
                      { label: 'Shortlisted', value: stats.shortlisted },
                      { label: 'Rejected', value: stats.rejected },
                    ].map((stat) => (
                      <View key={stat.label} style={styles.statChip}>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No applicants yet.</Text>}
        renderItem={({ item }) => {
          const profile = item.candidate.profile;
          const name = profile?.fullName ?? item.candidate.email;
          const expLabel = formatExperience(profile?.experienceYears);
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <CompanyAvatar name={name} size={48} />
                <View style={{ flex: 1 }}>
                  <StatusBadge status={item.status} />
                  <Text style={styles.name}>{name}</Text>
                  {profile?.headline ? <Text style={styles.meta}>{profile.headline}</Text> : null}
                  {profile?.currentCompany ? (
                    <Text style={styles.meta}>{profile.currentCompany}</Text>
                  ) : null}
                  <Text style={styles.meta}>
                    {[profile?.location, expLabel, profile?.noticePeriod]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  {(profile?.currentCtc || profile?.expectedCtc) && (
                    <Text style={styles.meta}>
                      CTC: {profile?.currentCtc || '—'} → {profile?.expectedCtc || '—'}
                    </Text>
                  )}
                  <Text style={styles.applied}>
                    Applied{' '}
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              {profile?.skills?.length ? (
                <View style={styles.skills}>
                  {profile.skills.slice(0, 8).map((skill) => (
                    <View key={skill} style={styles.skill}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {profile.skills.length > 8 ? (
                    <Text style={styles.meta}>+{profile.skills.length - 8} more</Text>
                  ) : null}
                </View>
              ) : null}

              {item.coverNote ? <CoverNoteBlock note={item.coverNote} style={{ marginTop: 10 }} /> : null}
              <ScreeningAnswersList
                questions={job?.screeningQuestions}
                answers={item.screeningAnswers}
                style={{ marginTop: 10 }}
              />

              <Pressable
                onPress={() => router.push(`/recruiter/candidates/${item.candidate.id}`)}
                style={styles.profileLink}
              >
                <Text style={styles.profileLinkText}>View profile</Text>
              </Pressable>
              {profile?.resumeUrl ? (
                <Pressable
                  style={styles.resumeLink}
                  onPress={() => {
                    const url = resolveAssetUrl(profile.resumeUrl);
                    if (url) Linking.openURL(url);
                  }}
                >
                  <Text style={styles.resumeLinkText}>Open resume</Text>
                </Pressable>
              ) : null}
              <View style={styles.actions}>
                {STATUS_OPTIONS.map((status) => (
                  <Pressable
                    key={status}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item.id, status)}
                    style={[styles.chip, item.status === status && styles.chipActive]}
                  >
                    <Text style={styles.chipText}>{formatRecruiterApplicationStatus(status)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        }}
      />
    </AppScreen>
  );
}
