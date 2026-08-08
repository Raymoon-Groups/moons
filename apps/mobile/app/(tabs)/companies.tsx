import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { CompaniesFilterRow } from '@/components/companies/companies-filter-row';
import { CompanyListingCard } from '@/components/companies/company-listing-card';
import { EmptyState } from '@/components/portal-ui';
import { apiFetch } from '@/lib/api';
import { COMPANY_CATEGORIES, filterCompanies, type CompanySortKey } from '@/lib/companies-filters';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { CompaniesPage, CompanyListing } from '@/lib/types';

const SORT_OPTIONS = [
  { label: 'Most jobs', value: 'jobs' as CompanySortKey },
  { label: 'A–Z', value: 'name' as CompanySortKey },
];

function formatCount(n: number) {
  return n.toLocaleString('en-IN');
}

export default function CompaniesScreen() {
  const { colors, isDark } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const paramQ = useMemo(() => {
    const raw = params.q;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value?.trim() || '';
  }, [params.q]);

  const inputRef = useRef<TextInput>(null);
  const [companies, setCompanies] = useState<CompanyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState(paramQ);
  const [locationQ, setLocationQ] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<CompanySortKey>('jobs');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (paramQ) setSearchQ(paramQ);
  }, [paramQ]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await apiFetch<CompaniesPage>('/jobs/companies?limit=100');
      // API can return the same employer twice; keep first occurrence only.
      const seen = new Set<string>();
      const unique = data.items.filter((item) => {
        const id = item.recruiterId?.trim();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setCompanies(unique);
    } catch (err) {
      setCompanies([]);
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterCompanies(companies, { categoryId: category, searchQ, locationQ, sortBy }),
    [companies, category, searchQ, locationQ, sortBy],
  );

  const categoryOptions = useMemo(
    () =>
      COMPANY_CATEGORIES.map((cat) => ({
        label: cat.label,
        value: cat.id,
      })),
    [],
  );

  const stats = useMemo(() => {
    const hiring = companies.filter((c) => c.openJobs >= 3).length;
    const roles = companies.reduce((sum, c) => sum + c.openJobs, 0);
    return { total: companies.length, hiring, roles };
  }, [companies]);

  const resultLabel = useMemo(() => {
    const count = filtered.length;
    if (!count) return 'No companies match';
    return `${formatCount(count)} compan${count === 1 ? 'y' : 'ies'}`;
  }, [filtered.length]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
        list: { flex: 1 },
        listContent: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm },
        header: { marginBottom: 4 },
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: theme.spacing.md,
        },
        field: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 50,
          backgroundColor: isDark ? colors.surfaceElevated : '#f4f7fb',
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
          paddingLeft: 8,
          paddingRight: 14,
          paddingVertical: 6,
        },
        fieldFocused: {
          borderColor: colors.blue,
          backgroundColor: isDark ? colors.surface : '#ffffff',
        },
        searchIcon: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
        },
        input: {
          flex: 1,
          fontSize: 15,
          lineHeight: 20,
          color: colors.heading,
          paddingVertical: 8,
          paddingHorizontal: 0,
          ...fontStyle('regular'),
        },
        clearBtn: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? colors.surface : 'rgba(15,28,51,0.06)',
        },
        statsRow: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: theme.spacing.md,
        },
        statCard: {
          flex: 1,
          minWidth: 0,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
          backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
          paddingVertical: 12,
          paddingHorizontal: 10,
          alignItems: 'center',
          gap: 2,
        },
        statValue: {
          fontSize: 16,
          color: colors.heading,
          ...fontStyle('bold'),
        },
        statLabel: {
          fontSize: 11,
          color: colors.muted,
          textAlign: 'center',
          ...fontStyle('semibold'),
        },
        resultCount: {
          fontSize: 13,
          marginBottom: theme.spacing.md,
          marginTop: 2,
        },
      }),
    [colors, isDark],
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => inputRef.current?.focus()}
            style={[styles.field, searchFocused && styles.fieldFocused]}
          >
            <View style={styles.searchIcon} pointerEvents="none">
              <Ionicons name="search" size={16} color={colors.blue} />
            </View>
            <TextInput
              ref={inputRef}
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="Search companies…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              accessibilityLabel="Search companies"
            />
            {searchQ.length > 0 ? (
              <Pressable
                onPress={() => setSearchQ('')}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={6}
              >
                <Ionicons name="close" size={14} color={colors.muted} />
              </Pressable>
            ) : null}
          </Pressable>
        </View>

        <CompaniesFilterRow
          location={locationQ}
          category={category}
          sort={sortBy}
          categoryOptions={categoryOptions}
          sortOptions={SORT_OPTIONS}
          onLocationChange={setLocationQ}
          onCategoryChange={setCategory}
          onSortChange={setSortBy}
        />

        {companies.length > 0 ? (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCount(stats.total)}</Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCount(stats.hiring)}</Text>
              <Text style={styles.statLabel}>Actively hiring</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCount(stats.roles)}</Text>
              <Text style={styles.statLabel}>Open roles</Text>
            </View>
          </View>
        ) : null}

        <Text style={[styles.resultCount, { color: colors.muted }, fontStyle('medium')]}>
          {resultLabel}
        </Text>

        {error ? (
          <Text style={{ color: colors.error, marginBottom: 8, ...fontStyle('medium') }}>{error}</Text>
        ) : null}
      </View>
    ),
    [
      styles,
      searchFocused,
      searchQ,
      locationQ,
      category,
      sortBy,
      categoryOptions,
      companies.length,
      stats,
      resultLabel,
      error,
      colors,
    ],
  );

  if (loading && companies.length === 0) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={{ marginTop: 12, color: colors.muted, ...fontStyle('medium') }}>
            Finding employers for you…
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <FlatList
        style={[styles.list, { backgroundColor: isDark ? colors.background : '#ffffff' }]}
        data={filtered}
        keyExtractor={(item, index) => item.recruiterId || `company-${index}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.blue} />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="business-outline"
              title="No companies found"
              message="Try a different keyword, location, or category to discover more employers."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <CompanyListingCard
            company={item}
            onPress={() => router.push(`/companies/${item.recruiterId}`)}
          />
        )}
      />
    </AppScreen>
  );
}
