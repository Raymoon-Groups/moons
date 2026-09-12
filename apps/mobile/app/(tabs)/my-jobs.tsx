import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { ConfirmModal } from '@/components/confirm-modal';
import { EmptyState } from '@/components/portal-ui';
import { RecruiterJobCard } from '@/components/recruiter/recruiter-job-card';
import { ApiError, authDelete, authFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { useNavChromeScrollProps } from '@/lib/nav-chrome';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding, useTabScreenTopPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

type FilterKey = 'all' | 'live' | 'closed';
type ConfirmAction =
  | { type: 'close'; job: JobListing }
  | { type: 'reopen'; job: JobListing }
  | { type: 'delete'; job: JobListing };

export default function MyJobsScreen() {
  const { colors, isDark } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const topPadding = useTabScreenTopPadding();
  const navScroll = useNavChromeScrollProps();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const stats = useMemo(() => {
    const live = jobs.filter((j) => j.status === 'PUBLISHED').length;
    const closed = jobs.filter((j) => j.status === 'CLOSED').length;
    return { total: jobs.length, live, closed };
  }, [jobs]);

  const filtered = useMemo(() => {
    if (filter === 'live') return jobs.filter((j) => j.status === 'PUBLISHED');
    if (filter === 'closed') return jobs.filter((j) => j.status === 'CLOSED');
    return jobs;
  }, [filter, jobs]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        list: { flex: 1 },
        listContent: {
          paddingHorizontal: theme.spacing.md,
          paddingBottom: bottomPadding,
          paddingTop: topPadding,
        },
        hero: {
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(63,116,204,0.12)',
          ...theme.shadow.soft,
        },
        heroInner: { padding: 18 },
        eyebrowRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        },
        eyebrow: {
          fontSize: 11,
          letterSpacing: 1.3,
          textTransform: 'uppercase',
          color: colors.blue,
          ...fontStyle('bold'),
        },
        briefcaseBadge: {
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(110,160,239,0.16)' : 'rgba(63,116,204,0.12)',
        },
        title: {
          marginTop: 10,
          fontSize: 26,
          lineHeight: 32,
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
        statsRow: {
          marginTop: 16,
          flexDirection: 'row',
          gap: 8,
        },
        statCard: {
          flex: 1,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
        },
        statValue: {
          fontSize: 20,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        statLabel: {
          marginTop: 2,
          fontSize: 11,
          color: colors.muted,
          ...fontStyle('semibold'),
        },
        postButton: {
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.blue,
          borderRadius: theme.radius.full,
          paddingVertical: 14,
          ...theme.shadow.button,
        },
        postButtonText: { color: '#fff', fontSize: 15, ...fontStyle('bold') },
        filters: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 14,
        },
        filterChip: {
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderWidth: 1,
        },
        filterChipText: { fontSize: 13, ...fontStyle('semibold') },
        errorBanner: {
          marginBottom: 12,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.error,
          backgroundColor: isDark ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.08)',
        },
        errorText: { color: colors.error, fontSize: 13, ...fontStyle('medium') },
      }),
    [bottomPadding, colors, isDark, topPadding],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await authFetch<JobListing[]>('/jobs/mine');
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleConfirm() {
    if (!confirm) return;
    setConfirmLoading(true);
    setActionError('');
    const { job, type } = confirm;
    try {
      if (type === 'close') {
        await authFetch(`/jobs/${job.id}/close`, { method: 'POST' });
      } else if (type === 'reopen') {
        await authFetch(`/jobs/${job.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'PUBLISHED' }),
        });
      } else {
        await authDelete(`/jobs/${job.id}`);
      }
      setConfirm(null);
      void load(true);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : `Could not ${type} job`,
      );
      setConfirm(null);
    } finally {
      setConfirmLoading(false);
    }
  }

  const filterOptions: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'live', label: 'Live', count: stats.live },
    { key: 'closed', label: 'Closed', count: stats.closed },
  ];

  const hero = (
    <View style={styles.hero}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(63,116,204,0.22)', 'rgba(15,28,51,0.35)', colors.surfaceElevated]
            : ['#dbe7fb', '#eef4fc', '#f7f9fc']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroInner}
      >
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>Recruiter workspace</Text>
          <View style={styles.briefcaseBadge}>
            <Ionicons name="briefcase" size={18} color={colors.blue} />
          </View>
        </View>
        <Text style={styles.title}>My posted jobs</Text>
        <Text style={styles.subtitle}>Manage listings, review applicants, and keep openings current.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: isDark ? '#6ee7b7' : '#047857' }]}>{stats.live}</Text>
            <Text style={styles.statLabel}>Live</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: isDark ? '#fcd34d' : '#b45309' }]}>{stats.closed}</Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/recruiter/jobs/new')}
          style={({ pressed }) => [styles.postButton, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel="Post a new job"
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.postButtonText}>Post a new job</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );

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
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        {...navScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.blue} />
        }
        ListHeaderComponent={
          <View>
            {hero}
            {actionError ? (
              <Pressable style={styles.errorBanner} onPress={() => setActionError('')}>
                <Text style={styles.errorText}>{actionError}</Text>
              </Pressable>
            ) : null}
            {jobs.length > 0 ? (
              <View style={styles.filters}>
                {filterOptions.map((option) => {
                  const active = filter === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => setFilter(option.key)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active ? colors.blue : isDark ? colors.surfaceElevated : '#fff',
                          borderColor: active ? colors.blue : isDark ? colors.border : 'rgba(15,28,51,0.08)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: active ? '#fff' : colors.heading },
                        ]}
                      >
                        {option.label} · {option.count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title={filter === 'all' ? 'No jobs posted yet' : `No ${filter} jobs`}
            message={
              filter === 'all'
                ? 'Create your first listing to start receiving applicants.'
                : 'Try another filter or post a new opening.'
            }
          />
        }
        renderItem={({ item }) => (
          <RecruiterJobCard
            job={item}
            onOpen={() => router.push(`/recruiter/jobs/${item.id}`)}
            onApplicants={() => router.push(`/recruiter/jobs/${item.id}/applicants`)}
            onEdit={() => router.push(`/recruiter/jobs/${item.id}/edit`)}
            onClose={item.status === 'PUBLISHED' ? () => setConfirm({ type: 'close', job: item }) : undefined}
            onReopen={item.status === 'CLOSED' ? () => setConfirm({ type: 'reopen', job: item }) : undefined}
            onDelete={() => setConfirm({ type: 'delete', job: item })}
          />
        )}
      />

      <ConfirmModal
        visible={!!confirm}
        loading={confirmLoading}
        onCancel={() => {
          if (confirmLoading) return;
          setConfirm(null);
        }}
        onConfirm={() => void handleConfirm()}
        title={
          confirm?.type === 'close'
            ? 'Close this job?'
            : confirm?.type === 'reopen'
              ? 'Reopen this job?'
              : 'Delete this job?'
        }
        message={
          confirm?.type === 'close'
            ? `"${confirm.job.title}" will stop accepting applications. You can reopen it later.`
            : confirm?.type === 'reopen'
              ? `"${confirm.job.title}" will be live again and visible to candidates.`
              : confirm
                ? `"${confirm.job.title}" will be permanently deleted. This cannot be undone.`
                : ''
        }
        confirmLabel={
          confirm?.type === 'close'
            ? 'Close listing'
            : confirm?.type === 'reopen'
              ? 'Reopen'
              : 'Delete job'
        }
        cancelLabel="Cancel"
        destructive={confirm?.type !== 'reopen'}
        icon={
          confirm?.type === 'close'
            ? 'lock-closed-outline'
            : confirm?.type === 'reopen'
              ? 'refresh-outline'
              : 'trash-outline'
        }
      />
    </AppScreen>
  );
}
