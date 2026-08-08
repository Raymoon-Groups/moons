import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { JobCard } from '@/components/job-card';
import { EmptyState } from '@/components/portal-ui';
import { apiFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { useSavedJobs } from '@/lib/saved-jobs-context';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { JobListing } from '@/lib/types';

export default function SavedJobsScreen() {
  const { colors, isDark } = useTheme();
  const bottomPadding = useTabScreenPadding(24);
  const { entries, savedCount, ready, refresh } = useSavedJobs();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!ready) return;
      if (isRefresh) {
        setRefreshing(true);
        await refresh();
      } else {
        setLoading(true);
      }

      // Prefer offline snapshots so Saved always works after bookmarking.
      const snapshotJobs = entries.map((e) => e.job);
      setJobs(snapshotJobs);

      // Optionally refresh from API for latest details (best effort).
      if (entries.length > 0) {
        try {
          const results = await Promise.all(
            entries.map(async (entry) => {
              try {
                return await apiFetch<JobListing>(`/jobs/${entry.id}`);
              } catch {
                return entry.job;
              }
            }),
          );
          setJobs(results);
        } catch {
          // keep snapshots
        }
      }

      setLoading(false);
      setRefreshing(false);
    },
    [entries, ready, refresh],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
        list: { flex: 1 },
        content: {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: bottomPadding,
          flexGrow: 1,
        },
        header: { marginBottom: theme.spacing.md },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 6,
        },
        title: {
          fontSize: 22,
          color: colors.heading,
          ...fontStyle('extrabold'),
        },
        countPill: {
          borderRadius: theme.radius.full,
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        countText: {
          fontSize: 13,
          color: colors.blue,
          ...fontStyle('bold'),
        },
        subtitle: {
          fontSize: 14,
          lineHeight: 20,
          color: colors.muted,
          ...fontStyle('regular'),
        },
        browseBtn: {
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.blue,
          borderRadius: theme.radius.full,
          paddingVertical: 14,
        },
        browseText: {
          color: '#fff',
          fontSize: 15,
          ...fontStyle('bold'),
        },
      }),
    [bottomPadding, colors, isDark],
  );

  // Show cached entries immediately while provider becomes ready.
  const listData = jobs.length > 0 ? jobs : entries.map((e) => e.job);

  if (!ready && listData.length === 0 && loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={{ marginTop: 12, color: colors.muted, ...fontStyle('medium') }}>
            Loading saved jobs…
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <FlatList
        style={[styles.list, { backgroundColor: isDark ? colors.background : '#ffffff' }]}
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.blue}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Saved jobs</Text>
              <View style={styles.countPill}>
                <Text style={styles.countText}>{savedCount} saved</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Roles you bookmarked while browsing. Tap the bookmark again to remove.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View>
            <EmptyState
              icon="bookmark-outline"
              title="No saved jobs yet"
              message="Tap the bookmark icon on any job card to save it here for later."
            />
            <Pressable
              onPress={() => router.push('/(tabs)/jobs' as never)}
              style={styles.browseBtn}
            >
              <Ionicons name="briefcase-outline" size={18} color="#fff" />
              <Text style={styles.browseText}>Browse jobs</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <JobCard
            job={item}
            showBookmark
            onPress={() => router.push(`/job/${item.id}` as never)}
          />
        )}
      />
    </AppScreen>
  );
}
