import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApplicationStatus } from '@moons/shared';
import type { NetworkUserCard } from '@moons/shared';
import { PersonCard } from '@/components/network/person-card';
import { SectionTitle } from '@/components/portal-ui';
import { authFetch } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { fetchSuggestions } from '@/lib/network';
import { subscribeRefresh } from '@/lib/refresh-events';
import {
  buildRecruiterCandidatesUrl,
  type RecruiterCandidateRow,
} from '@/lib/recruiter-candidates';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <SectionTitle>{title}</SectionTitle>
      <Pressable onPress={onSeeAll} hitSlop={8}>
        <Text style={[{ color: colors.blue, fontSize: 13 }, fontStyle('semibold')]}>See all</Text>
      </Pressable>
    </View>
  );
}

export function DashboardPeopleYouMayKnow() {
  const { colors } = useTheme();
  const [people, setPeople] = useState<NetworkUserCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSuggestions(1, 6);
      setPeople(data.items);
    } catch {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const unsub = subscribeRefresh('moons:connections-refresh', load);
    return unsub;
  }, [load]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (people.length === 0) return null;

  return (
    <View style={styles.block}>
      <SectionHeader
        title="People you may know"
        onSeeAll={() => router.push('/(tabs)/network' as never)}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {people.map((person) => (
          <View key={person.userId} style={styles.personCardWrap}>
            <PersonCard person={person} onUpdated={load} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function DashboardRecruiterCandidates() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<RecruiterCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await authFetch<RecruiterCandidateRow[]>(
          buildRecruiterCandidatesUrl({ status: ApplicationStatus.SUBMITTED }),
        );
        const seen = new Set<string>();
        const unique: RecruiterCandidateRow[] = [];
        for (const row of data) {
          if (seen.has(row.candidate.id)) continue;
          seen.add(row.candidate.id);
          unique.push(row);
          if (unique.length >= 4) break;
        }
        setRows(unique);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (rows.length === 0) return null;

  return (
    <View style={styles.block}>
      <SectionHeader
        title="Candidates"
        onSeeAll={() => router.push('/(tabs)/candidates' as never)}
      />
      {rows.map((row) => {
        const profile = row.candidate.profile;
        const name = profile?.fullName?.trim() || row.candidate.email.split('@')[0];
        const avatar = resolveAssetUrl(profile?.avatarUrl);

        return (
          <Pressable
            key={row.id}
            onPress={() => router.push(`/recruiter/candidates/${row.candidate.id}` as never)}
            style={[
              styles.candidateRow,
              { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
            ]}
          >
            <View style={[styles.candidateAvatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[{ color: colors.blue, fontSize: 16 }, fontStyle('bold')]}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.candidateCopy}>
              <Text numberOfLines={1} style={[{ color: colors.heading, fontSize: 15 }, fontStyle('semibold')]}>
                {name}
              </Text>
              <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {row.job.title}
                {profile?.location ? ` · ${profile.location}` : ''}
              </Text>
            </View>
            <View style={[styles.newBadge, { backgroundColor: `${colors.blue}14` }]}>
              <Text style={[{ color: colors.blue, fontSize: 10 }, fontStyle('bold')]}>NEW</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: theme.spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  loadingWrap: { paddingVertical: theme.spacing.lg, alignItems: 'center' },
  horizontalList: { gap: 12, paddingRight: theme.spacing.md },
  personCardWrap: { width: 280 },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 10,
  },
  candidateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  candidateCopy: { flex: 1, minWidth: 0 },
  newBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
