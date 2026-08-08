import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { CompanyDetailView } from '@/components/companies/company-detail-view';
import { EmptyState } from '@/components/portal-ui';
import { apiFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { PublicCompanyProfile } from '@/lib/types';

export default function CompanyDetailScreen() {
  const { recruiterId } = useLocalSearchParams<{ recruiterId: string }>();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  /** Clears the floating bottom tab bar so Open positions is fully scrollable. */
  const bottomPadding = useTabScreenPadding(24);
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
        list: { flex: 1 },
        container: {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: bottomPadding,
        },
        loadingText: { marginTop: 12, color: colors.muted, ...fontStyle('medium') },
      }),
    [bottomPadding, colors],
  );

  async function load(isRefresh = false) {
    if (!recruiterId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await apiFetch<PublicCompanyProfile>(`/profiles/companies/${recruiterId}`);
      setCompany(data);
    } catch (err) {
      setCompany(null);
      setError(err instanceof Error ? err.message : 'Company not found');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, [recruiterId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: company?.companyName?.trim() || 'Company',
      headerStyle: {
        backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
      },
    });
  }, [navigation, company?.companyName, colors.surfaceElevated, isDark]);

  if (loading && !company) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.loadingText}>Loading company…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!company) {
    return (
      <AppScreen>
        <View style={[styles.container, { flex: 1, justifyContent: 'center' }]}>
          <EmptyState
            icon="business-outline"
            title="Company not found"
            message={error || 'This employer profile is unavailable or may have been removed.'}
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        style={[styles.list, { backgroundColor: isDark ? colors.background : '#ffffff' }]}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.blue}
          />
        }
      >
        <CompanyDetailView company={company} />
      </ScrollView>
    </AppScreen>
  );
}
