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
import { JobsFilterRow } from '@/components/jobs/jobs-filter-row';
import { JobsSearchHero } from '@/components/jobs/jobs-search-hero';
import { EmptyState } from '@/components/portal-ui';
import { apiFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { JobListing, JobsPage } from '@/lib/types';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all', icon: 'apps-outline' as const },
  { label: 'Remote', value: EmploymentType.REMOTE, icon: 'globe-outline' as const },
  { label: 'Full-time', value: EmploymentType.FULL_TIME, icon: 'time-outline' as const },
  { label: 'Internship', value: EmploymentType.INTERNSHIP, icon: 'school-outline' as const },
  { label: 'Contract', value: EmploymentType.CONTRACT, icon: 'document-text-outline' as const },
];

export default function JobsScreen() {
  const { colors } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
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
      if (location.trim()) params.set('location', location.trim());
      if (experience) params.set('experience', experience);
      const data = await apiFetch<JobsPage>(`/jobs?${params}`);
      setJobs(data.items);
      setTotalJobs(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, location, experience]);

  useEffect(() => {
    const timer = setTimeout(() => load(), query || location ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query, location, experience]);

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((j) => j.employmentType === filter);
  }, [jobs, filter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count += 1;
    if (location.trim()) count += 1;
    if (experience) count += 1;
    if (filter !== 'all') count += 1;
    return count;
  }, [query, location, experience, filter]);

  const header = useMemo(
    () => (
      <View>
        <JobsSearchHero
          query={query}
          location={location}
          experience={experience}
          jobCount={totalJobs || jobs.length}
          onQueryChange={setQuery}
          onLocationChange={setLocation}
          onExperienceChange={setExperience}
          onSearch={() => void load()}
        />

        <View style={styles.resultsRow}>
          <Text style={[styles.resultsTitle, { color: colors.heading }, fontStyle('bold')]}>
            {filteredJobs.length > 0
              ? `${filteredJobs.length} role${filteredJobs.length === 1 ? '' : 's'} found`
              : 'Browse openings'}
          </Text>
          {activeFilterCount > 0 ? (
            <Text style={[styles.resultsMeta, { color: colors.blue }, fontStyle('semibold')]}>
              {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active
            </Text>
          ) : null}
        </View>

        <JobsFilterRow options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        {error ? (
          <Text style={{ color: colors.error, marginBottom: 8, ...fontStyle('medium') }}>{error}</Text>
        ) : null}
      </View>
    ),
    [
      query,
      location,
      experience,
      error,
      filter,
      colors,
      totalJobs,
      jobs.length,
      filteredJobs.length,
      activeFilterCount,
      load,
    ],
  );

  if (loading && jobs.length === 0) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={{ marginTop: 12, color: colors.muted, ...fontStyle('medium') }}>
            Finding great roles for you…
          </Text>
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.blue} />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="briefcase-outline"
              title="No jobs found"
              message="Try a different keyword, location, or filter to discover more roles."
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { flex: 1 },
  listContent: { padding: theme.spacing.md },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  resultsTitle: { fontSize: 15 },
  resultsMeta: { fontSize: 12 },
});
