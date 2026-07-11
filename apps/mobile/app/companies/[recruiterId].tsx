import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { CompanyDetailView } from '@/components/companies/company-detail-view';
import { apiFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { PublicCompanyProfile } from '@/lib/types';

export default function CompanyDetailScreen() {
  const { recruiterId } = useLocalSearchParams<{ recruiterId: string }>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
        container: { padding: theme.spacing.md, paddingBottom: 40 },
        error: { color: colors.error, textAlign: 'center', ...fontStyle('medium') },
        loadingText: { marginTop: 12, color: colors.muted, ...fontStyle('medium') },
      }),
    [colors],
  );

  useEffect(() => {
    if (!recruiterId) return;
    setLoading(true);
    setError('');
    void apiFetch<PublicCompanyProfile>(`/profiles/companies/${recruiterId}`)
      .then(setCompany)
      .catch((err) => {
        setCompany(null);
        setError(err instanceof Error ? err.message : 'Company not found');
      })
      .finally(() => setLoading(false));
  }, [recruiterId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: company?.companyName?.trim() || 'Company',
    });
  }, [navigation, company?.companyName]);

  if (loading) {
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
        <View style={styles.center}>
          <Text style={styles.error}>{error || 'Company not found'}</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <CompanyDetailView company={company} />
      </ScrollView>
    </AppScreen>
  );
}
