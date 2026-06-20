import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApplicationStatus } from '@moons/shared';
import { AppScreen } from '@/components/app-screen';
import { LoadingScreen } from '@/components/loading-screen';
import { authFetch } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { formatApplicationStatus } from '@/lib/format';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { ApplicantRow } from '@/lib/types';

const STATUS_OPTIONS = [
  ApplicationStatus.VIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.REJECTED,
] as const;

export default function ApplicantsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        status: { fontSize: 12, fontFamily: theme.fonts.bold, color: colors.blue },
        name: { marginTop: 4, fontSize: 16, fontFamily: theme.fonts.bold, color: colors.heading },
        meta: { marginTop: 4, fontSize: 13, fontFamily: theme.fonts.regular, color: colors.muted },
        profileLink: { marginTop: 10 },
        profileLinkText: { color: colors.blue, fontFamily: theme.fonts.semibold, fontSize: 13 },
        resumeLink: { marginTop: 6 },
        resumeLinkText: { color: colors.blue, fontFamily: theme.fonts.semibold, fontSize: 12 },
        actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        chip: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.full,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        chipActive: { borderColor: colors.blue, backgroundColor: colors.surface },
        chipText: { fontSize: 11, color: colors.foreground, fontFamily: theme.fonts.semibold },
      }),
    [colors],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await authFetch<ApplicantRow[]>(`/applications/job/${id}`);
      setApplicants(data);
    } catch {
      setApplicants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);
    try {
      await authFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppScreen>
      <FlatList
        data={applicants}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={<Text style={styles.empty}>No applicants yet.</Text>}
        renderItem={({ item }) => {
          const name = item.candidate.profile?.fullName ?? item.candidate.email;
          return (
            <View style={styles.card}>
              <Text style={styles.status}>{formatApplicationStatus(item.status)}</Text>
              <Text style={styles.name}>{name}</Text>
              {item.candidate.profile?.headline ? (
                <Text style={styles.meta}>{item.candidate.profile.headline}</Text>
              ) : null}
              {item.candidate.profile?.location ? (
                <Text style={styles.meta}>{item.candidate.profile.location}</Text>
              ) : null}
              <Pressable
                onPress={() => router.push(`/recruiter/candidates/${item.candidate.id}`)}
                style={styles.profileLink}
              >
                <Text style={styles.profileLinkText}>View profile</Text>
              </Pressable>
              {item.candidate.profile?.resumeUrl ? (
                <Pressable
                  style={styles.resumeLink}
                  onPress={() => {
                    const url = resolveAssetUrl(item.candidate.profile?.resumeUrl);
                    if (url) Linking.openURL(url);
                  }}
                >
                  <Text style={styles.resumeLinkText}>Open resume</Text>
                </Pressable>
              ) : null}
              <View style={styles.actions}>
                {STATUS_OPTIONS.map((status) => (
                  <Pressable
                    key={status}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item.id, status)}
                    style={[styles.chip, item.status === status && styles.chipActive]}
                  >
                    <Text style={styles.chipText}>{formatApplicationStatus(status)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        }}
      />
    </AppScreen>
  );
}
