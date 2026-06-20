import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { apiFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { formatEmploymentType } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

interface PublicCompanyProfile {
  recruiterId: string;
  companyName: string | null;
  companySummary: string | null;
  industry: string | null;
  companyLocation: string | null;
  openJobsCount: number;
  openJobs: Array<{
    id: string;
    title: string;
    location: string;
    employmentType: string;
    salaryRange: string | null;
  }>;
}

export default function CompanyDetailScreen() {
  const { recruiterId } = useLocalSearchParams<{ recruiterId: string }>();
  const { colors } = useTheme();
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        list: { padding: theme.spacing.md, paddingBottom: 32 },
        header: { marginBottom: 12 },
        title: { fontSize: 24, ...fontStyle('extrabold'), color: colors.heading },
        meta: { marginTop: 8, fontSize: 14, color: colors.muted },
        summary: { marginTop: 12, fontSize: 14, lineHeight: 22, color: colors.foreground },
        section: { marginTop: 20, fontSize: 16, ...fontStyle('bold'), color: colors.heading },
        jobCard: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          marginBottom: 10,
        },
        jobTitle: { fontSize: 15, ...fontStyle('bold'), color: colors.heading },
        jobMeta: { marginTop: 6, fontSize: 12, color: colors.muted },
        empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
      }),
    [colors],
  );

  useEffect(() => {
    if (!recruiterId) return;
    (async () => {
      try {
        const data = await apiFetch<PublicCompanyProfile>(`/profiles/companies/${recruiterId}`);
        setCompany(data);
      } catch {
        setCompany(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [recruiterId]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      </AppScreen>
    );
  }

  if (!company) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={styles.empty}>Company not found.</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <FlatList
        data={company.openJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{company.companyName ?? 'Company'}</Text>
            <Text style={styles.meta}>
              {[company.industry, company.companyLocation, `${company.openJobsCount} open jobs`]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {company.companySummary ? (
              <Text style={styles.summary}>{company.companySummary}</Text>
            ) : null}
            <Text style={styles.section}>Open positions</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No open jobs right now.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/job/${item.id}`)} style={styles.jobCard}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.jobMeta}>
              {[item.location, formatEmploymentType(item.employmentType)].filter(Boolean).join(' · ')}
            </Text>
          </Pressable>
        )}
      />
    </AppScreen>
  );
}
