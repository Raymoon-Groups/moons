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
import { EmptyState, ScreenHeader } from '@/components/portal-ui';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { CompaniesPage, CompanyListing } from '@/lib/types';

export default function CompaniesScreen() {
  const { colors } = useTheme();
  const [companies, setCompanies] = useState<CompanyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        list: { flex: 1 },
        listContent: { padding: theme.spacing.md, paddingBottom: 32 },
        header: { marginBottom: theme.spacing.md },
        title: { fontSize: 26, fontFamily: theme.fonts.extrabold, color: colors.heading },
        subtitle: { marginTop: 4, fontSize: 15, fontFamily: theme.fonts.regular, color: colors.muted, lineHeight: 22 },
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
        jobs: { marginTop: 6, fontSize: 12, fontFamily: theme.fonts.bold, color: colors.blue },
      }),
    [colors],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiFetch<CompaniesPage>('/jobs/companies?limit=50');
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
        data={companies}
        keyExtractor={(item) => item.recruiterId}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.blue} />}
        ListHeaderComponent={
          <ScreenHeader
            eyebrow="Employers"
            title="Top companies"
            subtitle="Discover employers actively hiring on MoonsJob"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No companies found"
            message="Check back soon for new employers."
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
                  {[item.industry, item.location].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.jobs}>{item.openJobs} open jobs</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </AppScreen>
  );
}

