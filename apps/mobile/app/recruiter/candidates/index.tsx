import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { LoadingScreen } from '@/components/loading-screen';
import { authFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { ApplicantRow } from '@/lib/types';

type RecruiterCandidateRow = ApplicantRow & {
  job: {
    id: string;
    title: string;
    companyName: string;
    location: string;
  };
};

export default function CandidatesScreen() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<RecruiterCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { padding: theme.spacing.md, paddingBottom: 32 },
        empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        name: { fontSize: 16, fontFamily: theme.fonts.bold, color: colors.heading },
        meta: { marginTop: 4, fontSize: 13, fontFamily: theme.fonts.regular, color: colors.muted },
      }),
    [colors],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await authFetch<RecruiterCandidateRow[]>('/applications/recruiter/candidates');
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppScreen>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={<Text style={styles.empty}>No candidates found.</Text>}
        renderItem={({ item }) => {
          const profile = item.candidate.profile;
          const name = profile?.fullName ?? item.candidate.email;
          return (
            <Pressable
              onPress={() => router.push(`/recruiter/candidates/${item.candidate.id}`)}
              style={styles.card}
            >
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.meta}>{item.job.title}</Text>
              {profile?.headline ? <Text style={styles.meta}>{profile.headline}</Text> : null}
              {profile?.location ? <Text style={styles.meta}>{profile.location}</Text> : null}
            </Pressable>
          );
        }}
      />
    </AppScreen>
  );
}
