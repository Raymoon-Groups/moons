import { router, useLocalSearchParams } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';
import { EmploymentType } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { JobCard } from '@/components/job-card';
import { JobsFilterRow, type JobsFilterSheet } from '@/components/jobs/jobs-filter-row';
import { JobsSearchHero } from '@/components/jobs/jobs-search-hero';
import { EmptyState } from '@/components/portal-ui';
import { apiFetch } from '@/lib/api';
import { EXPERIENCE_FILTER_OPTIONS } from '@/lib/experience-options';
import { fontStyle } from '@/lib/font-style';
import { useSavedJobs } from '@/lib/saved-jobs-context';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { JobListing, JobsPage } from '@/lib/types';

const JOB_TYPE_OPTIONS = [
  { label: 'All types', value: 'all' },
  { label: 'Remote', value: EmploymentType.REMOTE },
  { label: 'Full-time', value: EmploymentType.FULL_TIME },
  { label: 'Part-time', value: EmploymentType.PART_TIME },
  { label: 'Internship', value: EmploymentType.INTERNSHIP },
  { label: 'Contract', value: EmploymentType.CONTRACT },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
];

function formatVacancyCount(n: number) {
  return n.toLocaleString('en-IN');
}

export default function JobsScreen() {
  const { colors, isDark } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const { savedCount } = useSavedJobs();
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const paramQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [query, setQuery] = useState(paramQ?.trim() || '');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openSheet, setOpenSheet] = useState<JobsFilterSheet | null>(null);

  useEffect(() => {
    if (paramQ?.trim()) setQuery(paramQ.trim());
  }, [paramQ]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const searchParams = new URLSearchParams({ limit: '40' });
        if (query.trim()) searchParams.set('q', query.trim());
        if (location.trim()) searchParams.set('location', location.trim());
        if (experience) searchParams.set('experience', experience);
        const data = await apiFetch<JobsPage>(`/jobs?${searchParams}`);
        setJobs(data.items);
        setTotalJobs(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query, location, experience],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(), query || location ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query, location, experience]);

  const filteredJobs = useMemo(() => {
    let list = filter === 'all' ? jobs : jobs.filter((j) => j.employmentType === filter);
    list = [...list].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === 'oldest' ? da - db : db - da;
    });
    return list;
  }, [jobs, filter, sort]);

  const vacancyLabel = useMemo(() => {
    const count = totalJobs || filteredJobs.length;
    if (!count) return 'No job vacancies';
    return `${formatVacancyCount(count)} job vacanc${count === 1 ? 'y' : 'ies'}`;
  }, [totalJobs, filteredJobs.length]);

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <JobsSearchHero
          query={query}
          onQueryChange={setQuery}
          onSearch={() => void load()}
          onOpenFilters={() => setOpenSheet('experience')}
        />

        <JobsFilterRow
          location={location}
          jobType={filter}
          experience={experience}
          sort={sort}
          jobTypeOptions={JOB_TYPE_OPTIONS}
          experienceOptions={EXPERIENCE_FILTER_OPTIONS}
          sortOptions={SORT_OPTIONS}
          onLocationChange={setLocation}
          onJobTypeChange={setFilter}
          onExperienceChange={setExperience}
          onSortChange={setSort}
          openSheet={openSheet}
          onOpenSheetHandled={() => setOpenSheet(null)}
        />

        <View style={styles.metaRow}>
          <Text style={[styles.vacancyCount, { color: colors.muted }, fontStyle('medium')]}>
            {vacancyLabel}
          </Text>
          <Pressable
            onPress={() => router.push('/saved-jobs' as never)}
            style={[
              styles.savedBtn,
              {
                backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}12`,
              },
            ]}
            accessibilityLabel="Open saved jobs"
          >
            <Ionicons
              name={savedCount > 0 ? 'bookmark' : 'bookmark-outline'}
              size={15}
              color={colors.blue}
            />
            <Text style={[styles.savedBtnText, { color: colors.blue }, fontStyle('bold')]}>
              Saved{savedCount > 0 ? ` (${savedCount})` : ''}
            </Text>
          </Pressable>
        </View>

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
      sort,
      colors,
      isDark,
      vacancyLabel,
      savedCount,
      load,
      openSheet,
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
        style={[styles.list, { backgroundColor: isDark ? colors.background : '#ffffff' }]}
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
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
          <JobCard
            job={item}
            showBookmark
            onPress={() => router.push(`/job/${item.id}`)}
          />
        )}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm },
  header: { marginBottom: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: theme.spacing.md,
    marginTop: 2,
  },
  vacancyCount: {
    flex: 1,
    fontSize: 13,
  },
  savedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  savedBtnText: {
    fontSize: 13,
  },
});
