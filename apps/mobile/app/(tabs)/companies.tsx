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
import { CompanyAvatar } from '@/components/company-avatar';
import { resolveAssetUrl } from '@/lib/assets';
import { EmptyState, FilterChips, ScreenHeader } from '@/components/portal-ui';
import { SearchBar } from '@/components/search-bar';
import { apiFetch } from '@/lib/api';
import { COMPANY_CATEGORIES, filterCompanies, type CompanySortKey } from '@/lib/companies-filters';
import { useTheme } from '@/lib/theme-context';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { theme } from '@/lib/theme';
import type { CompaniesPage, CompanyListing } from '@/lib/types';

const SORT_OPTIONS = [
  { label: 'Most jobs', value: 'jobs' as CompanySortKey },
  { label: 'A–Z', value: 'name' as CompanySortKey },
];

export default function CompaniesScreen() {
  const { colors } = useTheme();
  const bottomPadding = useTabScreenPadding();
  const [companies, setCompanies] = useState<CompanyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [locationQ, setLocationQ] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<CompanySortKey>('jobs');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        list: { flex: 1 },
        listContent: { padding: theme.spacing.md, paddingBottom: bottomPadding },
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
          ...theme.shadow.card,
        },
        row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
        name: { fontSize: 16, fontFamily: theme.fonts.bold, color: colors.heading },
        meta: { marginTop: 4, fontSize: 13, fontFamily: theme.fonts.regular, color: colors.muted },
        tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
        tag: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: colors.surface,
        },
        tagText: { fontSize: 11, fontFamily: theme.fonts.medium, color: colors.muted },
        jobs: { marginTop: 6, fontSize: 12, fontFamily: theme.fonts.bold, color: colors.blue },
      }),
    [colors, bottomPadding],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiFetch<CompaniesPage>('/jobs/companies?limit=100');
      setCompanies(data.items);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
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
        keyExtractor={(item) => item.recruiterId}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.blue} />}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              eyebrow="Employers"
              title="Top companies"
              subtitle="Discover employers actively hiring on MoonsJob"
            />
            <SearchBar value={searchQ} onChangeText={setSearchQ} placeholder="Search companies…" />
            <SearchBar value={locationQ} onChangeText={setLocationQ} placeholder="Location…" />
            <FilterChips options={categoryOptions} value={category} onChange={setCategory} />
            <FilterChips options={SORT_OPTIONS} value={sortBy} onChange={(v) => setSortBy(v as CompanySortKey)} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No companies found"
            message="Try adjusting your search or filters."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/companies/${item.recruiterId}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.row}>
              <CompanyAvatar
                name={item.companyName}
                size={52}
                imageUrl={resolveAssetUrl(item.companyLogoUrl)}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.companyName}</Text>
                <Text style={styles.meta}>
                  {[item.companySize, item.location].filter(Boolean).join(' · ')}
                </Text>
                <View style={styles.tags}>
                  {item.companyType ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{item.companyType}</Text>
                    </View>
                  ) : null}
                  {item.industry ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{item.industry}</Text>
                    </View>
                  ) : null}
                  {item.openJobs >= 3 ? (
                    <View style={styles.tag}>
                      <Text style={[styles.tagText, { color: colors.blue }]}>Actively hiring</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.jobs}>{item.openJobs} open jobs</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </AppScreen>
  );
}
