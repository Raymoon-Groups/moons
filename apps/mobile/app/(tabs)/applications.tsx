import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { EmptyState, ScreenHeader } from '@/components/portal-ui';
import { StatusBadge } from '@/components/status-badge';
import { authFetch } from '@/lib/api';
import { formatEmploymentType } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { ApplicationWithJob } from '@/lib/types';

export default function ApplicationsScreen() {
  const { colors } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const [apps, setApps] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        list: { flex: 1 },
        listContent: { padding: theme.spacing.md, paddingBottom: bottomPadding },
        header: { marginBottom: theme.spacing.md },
        title: { fontSize: 26, fontFamily: theme.fonts.extrabold, color: colors.heading },
        subtitle: { marginTop: 4, fontSize: 15, fontFamily: theme.fonts.regular, color: colors.muted, lineHeight: 22 },
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: theme.spacing.md,
          overflow: 'hidden',
          ...theme.shadow.card,
        },
        topAccent: { height: 3, backgroundColor: colors.blue },
        cardBody: { padding: theme.spacing.md },
        row: { flexDirection: 'row', gap: 12 },
        jobTitle: { marginTop: 8, fontSize: 16, fontFamily: theme.fonts.bold, color: colors.heading },
        company: { marginTop: 2, fontSize: 14, fontFamily: theme.fonts.regular, color: colors.foreground },
        meta: { marginTop: 10, fontSize: 12, fontFamily: theme.fonts.medium, color: colors.muted },
        statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
        statChip: {
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        statLabel: { fontSize: 11, fontFamily: theme.fonts.medium, color: colors.muted },
        statValue: { fontSize: 14, fontFamily: theme.fonts.bold, color: colors.heading, marginTop: 2 },
        appliedMeta: { marginTop: 8, fontSize: 12, fontFamily: theme.fonts.medium, color: colors.muted },
        withdraw: { marginTop: 12, alignSelf: 'flex-start' },
        withdrawText: { color: colors.error, fontFamily: theme.fonts.bold, fontSize: 13 },
      }),
    [colors, bottomPadding],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await authFetch<ApplicationWithJob[]>('/applications/mine');
      setApps(data);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const countBy = (status: ApplicationStatus) =>
      apps.filter((a) => a.status === status).length;
    return {
      total: apps.length,
      submitted: countBy(ApplicationStatus.SUBMITTED),
      viewed: countBy(ApplicationStatus.VIEWED),
      shortlisted: countBy(ApplicationStatus.SHORTLISTED),
      rejected: countBy(ApplicationStatus.REJECTED),
    };
  }, [apps]);

  async function withdraw(app: ApplicationWithJob) {
    Alert.alert('Withdraw application', `Withdraw from ${app.job.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          setWithdrawingId(app.id);
          try {
            await authFetch(`/applications/${app.id}`, { method: 'DELETE' });
            setApps((prev) => prev.filter((a) => a.id !== app.id));
          } finally {
            setWithdrawingId(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <FlatList
        style={styles.list}
        data={apps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.blue} />}
        ListHeaderComponent={
          <>
            <ScreenHeader
              eyebrow="Applications"
              title="Your applications"
              subtitle="Track status updates from recruiters"
            />
            {apps.length > 0 ? (
              <View style={styles.statsRow}>
                {[
                  { label: 'Total', value: stats.total },
                  { label: 'Submitted', value: stats.submitted },
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
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No applications yet"
            message="Browse jobs and apply to see them tracked here."
          />
        }
        renderItem={({ item }) => {
          const canWithdraw =
            item.status === ApplicationStatus.SUBMITTED || item.status === ApplicationStatus.VIEWED;
          return (
            <Pressable onPress={() => router.push(`/job/${item.jobId}`)} style={styles.card}>
              <View style={styles.topAccent} />
              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <CompanyAvatar name={item.job.companyName} size={44} />
                  <View style={{ flex: 1 }}>
                    <StatusBadge status={item.status} />
                    <Text style={styles.jobTitle}>{item.job.title}</Text>
                    <Text style={styles.company}>{item.job.companyName}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {[item.job.location, formatEmploymentType(item.job.employmentType)].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.appliedMeta}>
                  Applied{' '}
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                {item.coverNote ? <CoverNoteBlock note={item.coverNote} style={{ marginTop: 10 }} /> : null}
                <ScreeningAnswersList
                  questions={item.job.screeningQuestions}
                  answers={item.screeningAnswers}
                  style={{ marginTop: 10 }}
                />
                {canWithdraw ? (
                  <Pressable onPress={() => withdraw(item)} disabled={withdrawingId === item.id} style={styles.withdraw}>
                    <Text style={styles.withdrawText}>
                      {withdrawingId === item.id ? 'Withdrawing…' : 'Withdraw application'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </AppScreen>
  );
}

