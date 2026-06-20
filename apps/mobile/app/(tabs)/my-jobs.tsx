import { Ionicons } from '@expo/vector-icons';
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
import { AppScreen } from '@/components/app-screen';
import { JobCard } from '@/components/job-card';
import { EmptyState, ScreenHeader } from '@/components/portal-ui';
import { authFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

export default function MyJobsScreen() {
  const { colors } = useTheme();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        list: { flex: 1 },
        listContent: { padding: theme.spacing.md, paddingBottom: 32 },
        header: { marginBottom: theme.spacing.md },
        postButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.blue,
          borderRadius: theme.radius.full,
          paddingVertical: 14,
        },
        postButtonText: { color: '#fff', fontFamily: theme.fonts.bold, fontSize: 15 },
        wrap: { marginBottom: 4 },
        actions: { flexDirection: 'row', gap: 16, paddingHorizontal: 4, marginTop: -8, marginBottom: 8 },
        action: {},
        actionText: { color: colors.blue, fontFamily: theme.fonts.bold, fontSize: 13 },
        danger: { color: colors.error, fontFamily: theme.fonts.bold, fontSize: 13 },
      }),
    [colors],
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
    load();
  }, [load]);

  async function closeJob(job: JobListing) {
    Alert.alert('Close job', `Close "${job.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        onPress: async () => {
          await authFetch(`/jobs/mine/${job.id}/close`, { method: 'PATCH' });
          load(true);
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
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.blue} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              eyebrow="Recruiter"
              title="My posted jobs"
              subtitle="Manage listings and review applicants"
            />
            <Pressable onPress={() => router.push('/recruiter/jobs/new')} style={styles.postButton}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.postButtonText}>Post a new job</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No jobs posted yet"
            message="Create your first listing to start receiving applicants."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.wrap}>
            <JobCard job={item} onPress={() => router.push(`/recruiter/jobs/${item.id}`)} />
            <View style={styles.actions}>
              <Pressable onPress={() => router.push(`/recruiter/jobs/${item.id}/applicants`)} style={styles.action}>
                <Text style={styles.actionText}>Applicants</Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/recruiter/jobs/${item.id}/edit`)} style={styles.action}>
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
              {item.status === 'PUBLISHED' ? (
                <Pressable onPress={() => closeJob(item)}>
                  <Text style={styles.danger}>Close</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      />
    </AppScreen>
  );
}

