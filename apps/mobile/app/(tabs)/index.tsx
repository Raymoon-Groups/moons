import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { JobCard } from '@/components/job-card';
import { QuickLinkCard, StatCard } from '@/components/menu-row';
import { ProfileRing } from '@/components/profile-ring';
import { PrimaryBanner, SectionTitle } from '@/components/portal-ui';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useProfile } from '@/lib/use-profile';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { ApplicationWithJob, CandidateStats, JobListing, RecruiterStats } from '@/lib/types';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const { profile, loading: profileLoading, name, avatarUrl, logoUrl } = useProfile();

  const [candidateStats, setCandidateStats] = useState<CandidateStats | null>(null);
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobListing[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      if (isRecruiter) {
        const [stats, jobs] = await Promise.all([
          authFetch<RecruiterStats>('/jobs/mine/stats'),
          authFetch<JobListing[]>('/jobs/mine'),
        ]);
        setRecruiterStats(stats);
        setRecentJobs(jobs.slice(0, 3));
      } else {
        const [stats, apps] = await Promise.all([
          authFetch<{ applicationsCount: number }>('/applications/mine/stats'),
          authFetch<ApplicationWithJob[]>('/applications/mine'),
        ]);
        setCandidateStats({
          total: stats.applicationsCount,
          submitted: apps.filter((a) => a.status === 'SUBMITTED').length,
          viewed: apps.filter((a) => a.status === 'VIEWED').length,
          shortlisted: apps.filter((a) => a.status === 'SHORTLISTED').length,
          rejected: apps.filter((a) => a.status === 'REJECTED').length,
        });
      }
    } catch {
      // dashboard still renders
    } finally {
      setStatsLoading(false);
    }
  }, [isRecruiter]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const loading = profileLoading || statsLoading;

  const heroColors = isDark
    ? (['rgba(74, 127, 212, 0.22)', 'rgba(26, 39, 68, 0.55)'] as const)
    : (['rgba(74, 127, 212, 0.14)', 'rgba(238, 242, 247, 0.95)'] as const);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      </AppScreen>
    );
  }

  const displayName = name || 'there';
  const completion = profile?.completionPercent ?? 0;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={heroColors} style={[styles.hero, { borderColor: colors.border }]}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.blue }, fontStyle('bold')]}>MOONSJOB</Text>
              <Text style={[styles.greeting, { color: colors.heading }, fontStyle('extrabold')]}>
                Hello, {displayName.split(' ')[0]}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }, fontStyle('regular')]}>
                {isRecruiter ? 'Your hiring command center' : 'Your job search dashboard'}
              </Text>
            </View>
            <ProfileRing
              percent={completion}
              name={displayName}
              avatarUrl={avatarUrl}
              logoUrl={isRecruiter ? logoUrl : null}
              size={76}
            />
          </View>
          {profile ? (
            <Text style={[styles.completion, { color: colors.blue }, fontStyle('bold')]}>
              Profile {completion}% complete
            </Text>
          ) : null}
        </LinearGradient>

        {!isRecruiter && completion < 100 ? (
          <PrimaryBanner
            title="Complete your profile"
            subtitle="Profiles above 80% get more recruiter views and faster callbacks."
            ctaLabel="Edit profile"
            onPress={() => router.push('/profile/edit')}
          />
        ) : null}

        {isRecruiter && recruiterStats ? (
          <View style={styles.statsRow}>
            <StatCard label="Live jobs" value={String(recruiterStats.liveJobs)} accent={colors.success} />
            <StatCard label="Applicants" value={String(recruiterStats.totalApplicants)} />
            <StatCard label="New" value={String(recruiterStats.newApplicants)} accent={colors.blue} />
          </View>
        ) : null}

        {!isRecruiter && candidateStats ? (
          <View style={styles.statsRow}>
            <StatCard label="Applied" value={String(candidateStats.total)} />
            <StatCard label="Shortlisted" value={String(candidateStats.shortlisted)} accent={colors.success} />
            <StatCard label="Viewed" value={String(candidateStats.viewed)} accent={colors.info} />
          </View>
        ) : null}

        <SectionTitle>Quick links</SectionTitle>
        {isRecruiter ? (
          <>
            <QuickLinkCard title="My jobs" subtitle="Manage postings" icon="folder-open" onPress={() => router.push('/(tabs)/my-jobs')} />
            <QuickLinkCard title="Post a job" subtitle="Create a new listing" icon="add-circle" onPress={() => router.push('/recruiter/jobs/new')} />
            <QuickLinkCard title="Candidates" subtitle="Browse applicants" icon="people" onPress={() => router.push('/recruiter/candidates')} />
            <QuickLinkCard title="Companies" subtitle="Explore employers" icon="business" onPress={() => router.push('/(tabs)/companies')} />
          </>
        ) : (
          <>
            <QuickLinkCard title="Browse jobs" subtitle="Find your next role" icon="briefcase" onPress={() => router.push('/(tabs)/jobs')} />
            <QuickLinkCard title="Applications" subtitle="Track your status" icon="document-text" onPress={() => router.push('/(tabs)/applications')} />
            <QuickLinkCard title="Companies" subtitle="Explore employers" icon="business" onPress={() => router.push('/(tabs)/companies')} />
            <QuickLinkCard title="Edit profile" subtitle="Boost visibility" icon="create" onPress={() => router.push('/profile/edit')} />
          </>
        )}

        {isRecruiter && recentJobs.length > 0 ? (
          <>
            <SectionTitle>Recent postings</SectionTitle>
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} onPress={() => router.push(`/recruiter/jobs/${job.id}`)} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: theme.spacing.md, paddingBottom: 32 },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, marginBottom: 4 },
  greeting: { fontSize: 24, lineHeight: 30 },
  subtitle: { marginTop: 6, fontSize: 14, lineHeight: 21 },
  completion: { marginTop: 12, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.md },
});
