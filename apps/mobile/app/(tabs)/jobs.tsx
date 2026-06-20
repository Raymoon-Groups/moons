import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmploymentType } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { JobCard } from '@/components/job-card';
import { EmptyState, FilterChips, ScreenHeader } from '@/components/portal-ui';
import { SearchBar } from '@/components/search-bar';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { JobListing, JobsPage } from '@/lib/types';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Remote', value: EmploymentType.REMOTE },
  { label: 'Full-time', value: EmploymentType.FULL_TIME },
  { label: 'Internship', value: EmploymentType.INTERNSHIP },
];

export default function JobsScreen() {
  const { colors } = useTheme();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '40' });
      if (query.trim()) params.set('q', query.trim());
      const data = await apiFetch<JobsPage>(`/jobs?${params}`);
      setJobs(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => load(), query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((j) => j.employmentType === filter);
  }, [jobs, filter]);

  const header = useMemo(
    () => (
      <View>
        <ScreenHeader
          eyebrow="Job search"
          title="Find your next role"
          subtitle="Browse openings from top companies across India"
        />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Role, company, or location…" />
        <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        {error ? (
          <Text style={{ color: colors.error, marginBottom: 8, fontFamily: theme.fonts.medium }}>{error}</Text>
        ) : null}
      </View>
    ),
    [query, error, filter, colors],
  );

  if (loading && jobs.length === 0) {
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
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.blue} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="briefcase-outline"
              title="No jobs found"
              message="Try adjusting your search or filters."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <JobCard job={item} showApply onPress={() => router.push(`/job/${item.id}`)} />
        )}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { padding: theme.spacing.md, paddingBottom: 32 },
});
