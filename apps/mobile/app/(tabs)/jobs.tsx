import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { EmploymentType, rankJobsForQuery } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { JobCard } from '@/components/job-card';
import { JobsFilterRow, type JobsFilterSheet } from '@/components/jobs/jobs-filter-row';
import { JobsSearchHero } from '@/components/jobs/jobs-search-hero';
import { EmptyState } from '@/components/portal-ui';
import { apiFetch } from '@/lib/api';
import { EXPERIENCE_FILTER_OPTIONS } from '@/lib/experience-options';
import { fontStyle } from '@/lib/font-style';
import { useNavChromeScrollProps } from '@/lib/nav-chrome';
import { useSavedJobs } from '@/lib/saved-jobs-context';
import { fetchPublishedJobsPool } from '@/lib/search-suggestions';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding, useTabScreenTopPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { JobListing, JobsPage } from '@/lib/types';

const PAGE_SIZE = 20;

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

function dedupeJobs(items: JobListing[]): JobListing[] {
  const seen = new Set<string>();
  return items.filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });
}

export default function JobsScreen() {
  const { colors, isDark } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const topPadding = useTabScreenTopPadding();
  const navScroll = useNavChromeScrollProps();
  const { savedCount } = useSavedJobs();
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const paramQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState(paramQ?.trim() || '');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openSheet, setOpenSheet] = useState<JobsFilterSheet | null>(null);
  const hasLoadedRef = useRef(false);
  const loadingMoreLock = useRef(false);
  const loadSeq = useRef(0);
  /** Cached ranked results for short acronym searches (client-side pool). */
  const shortRankedRef = useRef<JobListing[]>([]);

  useEffect(() => {
    if (paramQ?.trim()) setQuery(paramQ.trim());
  }, [paramQ]);

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      const seq = append ? loadSeq.current : ++loadSeq.current;
      if (append) {
        if (loadingMoreLock.current) return;
        loadingMoreLock.current = true;
        setLoadingMore(true);
      } else if (nextPage === 1 && !hasLoadedRef.current) {
        setLoading(true);
      }
      setError('');
      try {
        const trimmedQ = query.trim();
        const shortQuery = trimmedQ.length > 0 && trimmedQ.length <= 3;

        if (shortQuery) {
          if (!append || shortRankedRef.current.length === 0) {
            const pool = await fetchPublishedJobsPool({
              location: location.trim() || undefined,
              experience: experience || undefined,
              maxItems: 200,
            });
            if (seq !== loadSeq.current) return;
            shortRankedRef.current = rankJobsForQuery(pool, trimmedQ);
          }
          const ranked = shortRankedRef.current;
          const total = ranked.length;
          const start = (nextPage - 1) * PAGE_SIZE;
          const pageItems = ranked.slice(start, start + PAGE_SIZE);
          setJobs((prev) => dedupeJobs(append ? [...prev, ...pageItems] : pageItems));
          setTotalJobs(total);
          setPage(nextPage);
          setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE) || 1));
        } else {
          shortRankedRef.current = [];
          const searchParams = new URLSearchParams({
            limit: String(PAGE_SIZE),
            page: String(nextPage),
          });
          if (trimmedQ) searchParams.set('q', trimmedQ);
          if (location.trim()) searchParams.set('location', location.trim());
          if (experience) searchParams.set('experience', experience);
          const data = await apiFetch<JobsPage>(`/jobs?${searchParams}`);
          if (seq !== loadSeq.current) return;
          const ranked = trimmedQ ? rankJobsForQuery(data.items, trimmedQ) : data.items;
          setJobs((prev) => dedupeJobs(append ? [...prev, ...ranked] : ranked));
          setTotalJobs(data.total);
          setPage(data.page);
          setTotalPages(Math.max(1, data.totalPages || 1));
        }
        hasLoadedRef.current = true;
      } catch (err) {
        if (seq !== loadSeq.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        if (seq === loadSeq.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
        loadingMoreLock.current = false;
      }
    },
    [query, location, experience],
  );

  useEffect(() => {
    const timer = setTimeout(() => void load(1, false), query || location ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query, location, experience]);

  const hasMore = page < totalPages;

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
    if (!totalJobs) return 'No job vacancies';
    if (jobs.length < totalJobs && filter === 'all') {
      return `Showing ${formatVacancyCount(jobs.length)} of ${formatVacancyCount(totalJobs)} jobs`;
    }
    const count = filter === 'all' ? totalJobs : filteredJobs.length;
    return `${formatVacancyCount(count)} job vacanc${count === 1 ? 'y' : 'ies'}`;
  }, [totalJobs, jobs.length, filteredJobs.length, filter]);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
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
      location,
      experience,
      error,
      filter,
      sort,
      colors,
      isDark,
      vacancyLabel,
      savedCount,
      openSheet,
    ],
  );

  const listFooter = (
    <View style={styles.footer}>
      {loadingMore ? (
        <ActivityIndicator color={colors.blue} style={{ marginVertical: 16 }} />
      ) : hasMore ? (
        <Pressable
          onPress={() => void load(page + 1, true)}
          style={[
            styles.loadMoreBtn,
            {
              backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}12`,
              borderColor: isDark ? `${colors.blue}40` : `${colors.blue}28`,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Load more jobs"
        >
          <Text style={[styles.loadMoreText, { color: colors.blue }, fontStyle('bold')]}>
            Load more jobs
          </Text>
          <Text style={[styles.loadMoreMeta, { color: colors.muted }, fontStyle('medium')]}>
            Page {page} of {totalPages}
          </Text>
        </Pressable>
      ) : jobs.length > 0 ? (
        <Text style={[styles.endLabel, { color: colors.silver }, fontStyle('medium')]}>
          You’re all caught up
        </Text>
      ) : null}
    </View>
  );

  if (loading && jobs.length === 0) {
    return (
      <AppScreen>
        <View style={[styles.searchChrome, { paddingTop: topPadding }]}>
          <JobsSearchHero
            query={query}
            onQueryChange={setQuery}
            onSearch={() => void load(1, false)}
            onOpenFilters={() => setOpenSheet('experience')}
          />
        </View>
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
      <View
        style={[
          styles.searchChrome,
          {
            paddingTop: topPadding,
            backgroundColor: isDark ? colors.background : '#ffffff',
            borderBottomColor: isDark ? colors.borderSubtle : 'rgba(15,28,51,0.06)',
          },
        ]}
      >
        <JobsSearchHero
          query={query}
          onQueryChange={setQuery}
          onSearch={() => void load(1, false)}
          onOpenFilters={() => setOpenSheet('experience')}
        />
      </View>
      <FlatList
        style={[styles.list, { backgroundColor: isDark ? colors.background : '#ffffff' }]}
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        {...navScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(1, false);
            }}
            tintColor={colors.blue}
          />
        }
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="briefcase-outline"
              title="No jobs found"
              message="Try a different keyword, location, or filter to discover more roles."
            />
          ) : null
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (hasMore && !loading && !loadingMore) void load(page + 1, true);
        }}
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
  searchChrome: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 4,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: theme.spacing.md },
  listHeader: { marginBottom: 4, paddingTop: 10 },
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
  footer: {
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: 'center',
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 200,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: 14,
  },
  loadMoreMeta: {
    fontSize: 11,
  },
  endLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
