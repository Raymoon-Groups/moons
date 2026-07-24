import { UserRole, type NetworkStats, type NetworkUserCard } from '@moons/shared';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { AuthenticatedScreen } from '@/components/authenticated-screen';
import { PersonCard, type ConnectionUpdate } from '@/components/network/person-card';
import { NetworkListRow } from '@/components/network/network-list-row';
import { NetworkTabs, type NetworkTabId } from '@/components/network/network-tabs';
import { EmptyState, ScreenHeader } from '@/components/portal-ui';
import { SearchBar } from '@/components/search-bar';
import { Input } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { OPEN_ON_MOONS_LABEL } from '@/lib/open-on-moons';
import {
  fetchConnections,
  fetchNetworkStats,
  fetchPendingReceived,
  fetchPendingSent,
  fetchRecentConnections,
  fetchSuggestions,
  searchProfessionals,
  type ConnectionListItem,
  type PendingRequestItem,
} from '@/lib/network';
import { fontStyle } from '@/lib/font-style';
import { useNavIndicators } from '@/lib/nav-indicators';
import { subscribeRefresh } from '@/lib/refresh-events';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function applyConnectionUpdate(
  list: NetworkUserCard[],
  userId: string,
  update: ConnectionUpdate,
): NetworkUserCard[] {
  return list.map((person) =>
    person.userId === userId
      ? {
          ...person,
          connectionStatus: update.connectionStatus,
          connectionId: update.connectionId || null,
          connectionDirection: update.connectionDirection,
        }
      : person,
  );
}

function FilterPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterPill,
        active
          ? { backgroundColor: colors.blue }
          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
      ]}
    >
      <Text
        style={[
          styles.filterPillText,
          { color: active ? '#fff' : colors.muted },
          active ? fontStyle('bold') : fontStyle('semibold'),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function NetworkScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { acknowledgeNetworkBadge } = useNavIndicators();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const params = useLocalSearchParams<{ tab?: string }>();

  const initialTab = useMemo<NetworkTabId>(() => {
    const raw = typeof params.tab === 'string' ? params.tab : '';
    if (raw === 'pending' || raw === 'sent' || raw === 'recent' || raw === 'suggestions' || raw === 'connections') {
      return raw;
    }
    return 'connections';
  }, [params.tab]);

  const [tab, setTab] = useState<NetworkTabId>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<NetworkStats | null>(null);

  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [pending, setPending] = useState<PendingRequestItem[]>([]);
  const [sent, setSent] = useState<PendingRequestItem[]>([]);
  const [suggestions, setSuggestions] = useState<NetworkUserCard[]>([]);
  const [recent, setRecent] = useState<ConnectionListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSkills, setSearchSkills] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRole, setSearchRole] = useState<'CANDIDATE' | 'RECRUITER' | ''>('');
  const [searchOpenToWork, setSearchOpenToWork] = useState(false);
  const [searchHiring, setSearchHiring] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<NetworkUserCard[]>([]);
  const [searching, setSearching] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await fetchNetworkStats());
    } catch {
      // keep existing stats
    }
  }, []);

  const loadTab = useCallback(
    async (isRefresh = false) => {
      if (searchActive) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        await refreshStats();
        switch (tab) {
          case 'connections': {
            const data = await fetchConnections();
            setConnections(data.items);
            break;
          }
          case 'pending': {
            const data = await fetchPendingReceived();
            setPending(data.items);
            break;
          }
          case 'sent': {
            const data = await fetchPendingSent();
            setSent(data.items);
            break;
          }
          case 'suggestions': {
            const data = await fetchSuggestions();
            setSuggestions(data.items);
            break;
          }
          case 'recent':
            setRecent(await fetchRecentConnections());
            break;
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load network');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab, searchActive, refreshStats],
  );

  useFocusEffect(
    useCallback(() => {
      void loadTab();
      void (async () => {
        try {
          const nextStats = await fetchNetworkStats();
          setStats(nextStats);
          await acknowledgeNetworkBadge(nextStats.pendingReceived);
        } catch {
          // ignore badge clear errors
        }
      })();
    }, [loadTab, acknowledgeNetworkBadge]),
  );

  useEffect(() => {
    if (!searchActive) void loadTab();
  }, [tab, searchActive, loadTab]);

  useEffect(() => {
    const unsub = subscribeRefresh('moons:connections-refresh', () => {
      void loadTab(true);
    });
    return unsub;
  }, [loadTab]);

  function handleConnectionChange(userId: string, update: ConnectionUpdate) {
    if (
      update.connectionStatus === 'ACCEPTED' ||
      update.connectionStatus === 'NONE' ||
      update.connectionStatus === 'REJECTED'
    ) {
      setSuggestions((prev) => prev.filter((p) => p.userId !== userId));
    } else {
      setSuggestions((prev) => applyConnectionUpdate(prev, userId, update));
    }
    setSearchResults((prev) => applyConnectionUpdate(prev, userId, update));
    void refreshStats();
  }

  function clearSearch() {
    setSearchActive(false);
    setSearchResults([]);
    setSearchQuery('');
    setSearchSkills('');
    setSearchLocation('');
    setSearchRole('');
    setSearchOpenToWork(false);
    setSearchHiring(false);
    setError('');
  }

  async function runSearch() {
    const q = searchQuery.trim();
    if (!q && !searchSkills.trim() && !searchLocation.trim() && !searchRole && !searchOpenToWork && !searchHiring) {
      clearSearch();
      return;
    }
    setSearching(true);
    setSearchActive(true);
    setError('');
    try {
      const data = await searchProfessionals({
        q,
        skills: searchSkills,
        location: searchLocation,
        role: searchRole,
        ...(searchOpenToWork ? { openToWork: true } : {}),
        ...(searchHiring ? { isHiring: true } : {}),
      });
      setSearchResults(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  const listData: NetworkUserCard[] = useMemo(() => {
    if (searchActive) return searchResults;
    switch (tab) {
      case 'connections':
        return connections.map((r) => ({
          ...r.user,
          connectionStatus: 'ACCEPTED',
          connectionId: r.connectionId,
        }));
      case 'pending':
        return pending
          .filter((item) => item.fromUser)
          .map((item) => ({
            ...item.fromUser!,
            connectionStatus: 'PENDING',
            connectionId: item.id,
            connectionDirection: 'received' as const,
          }));
      case 'sent':
        return sent
          .filter((item) => item.toUser)
          .map((item) => ({
            ...item.toUser!,
            connectionStatus: 'PENDING',
            connectionId: item.id,
            connectionDirection: 'sent' as const,
          }));
      case 'suggestions':
        return suggestions;
      case 'recent':
        return recent.map((r) => ({
          ...r.user,
          connectionStatus: 'ACCEPTED',
          connectionId: r.connectionId,
        }));
      default:
        return [];
    }
  }, [searchActive, searchResults, tab, connections, pending, sent, suggestions, recent]);

  const emptyState = useMemo(() => {
    if (searchActive) {
      return { title: 'No professionals found', message: 'Try a different name, skill, or company keyword.' };
    }
    switch (tab) {
      case 'connections':
        return { title: 'No connections yet', message: 'Browse suggestions or search professionals to start building your network.' };
      case 'pending':
        return { title: 'No pending requests', message: 'When someone sends you a connection invite, it will show up here.' };
      case 'sent':
        return { title: 'No sent requests', message: 'Invites you send will appear here until they are accepted or declined.' };
      case 'recent':
        return { title: 'No recent connections', message: 'People you connect with will appear here.' };
      default:
        return { title: 'No suggestions yet', message: 'Complete your profile for better recommendations.' };
    }
  }, [searchActive, tab]);

  const resultLabel = searchActive
    ? `${listData.length} result${listData.length === 1 ? '' : 's'}`
    : tab === 'suggestions' || tab === 'recent'
      ? `${listData.length} ${tab === 'suggestions' ? 'suggestion' : 'connection'}${listData.length === 1 ? '' : 's'}`
      : `${listData.length} ${listData.length === 1 ? 'person' : 'people'}`;

  const isSocialTab = tab === 'connections' || tab === 'pending' || tab === 'sent';

  return (
    <AppScreen>
      <AuthenticatedScreen>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => (searchActive ? void runSearch() : void loadTab(true))}
              tintColor={colors.blue}
            />
          }
          ListHeaderComponent={
            <View>
              <ScreenHeader
                eyebrow="Connections"
                title="My Network"
                subtitle={
                  isRecruiter
                    ? 'Discover talent and grow your professional network.'
                    : 'Connect with professionals who share your skills and industry.'
                }
              />

              {stats && !searchActive ? (
                <View style={[styles.statsBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <StatItem
                    label="Connections"
                    value={stats.connections}
                    active={tab === 'connections'}
                    onPress={() => setTab('connections')}
                  />
                  <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
                  <StatItem
                    label="Pending"
                    value={stats.pendingReceived}
                    active={tab === 'pending'}
                    onPress={() => setTab('pending')}
                  />
                  <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
                  <StatItem
                    label="Sent"
                    value={stats.pendingSent}
                    active={tab === 'sent'}
                    onPress={() => setTab('sent')}
                  />
                </View>
              ) : null}

              <View style={[styles.searchPanel, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[{ color: colors.heading, fontSize: 15 }, fontStyle('bold')]}>Search professionals</Text>
                <Text style={[{ color: colors.muted, fontSize: 12, marginTop: 4 }, fontStyle('regular')]}>
                  {isRecruiter
                    ? 'Find candidates by name, skills, location, or availability'
                    : 'Name, skills, location, or hiring status'}
                </Text>

                <View style={styles.searchSection}>
                  <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by name or headline"
                    onSubmitEditing={() => void runSearch()}
                  />
                  <View style={styles.searchActions}>
                    {searchActive ? (
                      <Pressable onPress={clearSearch} style={styles.clearBtn}>
                        <Text style={{ color: colors.muted, ...fontStyle('semibold'), fontSize: 13 }}>Clear</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => void runSearch()} style={[styles.searchBtn, { backgroundColor: colors.blue }]}>
                      <Text style={{ color: '#fff', ...fontStyle('bold'), fontSize: 14 }}>
                        {searching ? 'Searching…' : 'Search'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Input value={searchSkills} onChangeText={setSearchSkills} placeholder="Skills" />
                <View style={styles.filterRow}>
                  <View style={{ flex: 1 }}>
                    <Input value={searchLocation} onChangeText={setSearchLocation} placeholder="Location" />
                  </View>
                </View>

                <View style={styles.roleFilters}>
                  <FilterPill
                    active={searchRole === ''}
                    label="All roles"
                    onPress={() => setSearchRole('')}
                  />
                  <FilterPill
                    active={searchRole === UserRole.CANDIDATE}
                    label="Candidates"
                    onPress={() => setSearchRole(UserRole.CANDIDATE)}
                  />
                  <FilterPill
                    active={searchRole === UserRole.RECRUITER}
                    label="Recruiters"
                    onPress={() => setSearchRole(UserRole.RECRUITER)}
                  />
                </View>

                <View style={styles.roleFilters}>
                  {isRecruiter ? (
                    <FilterPill
                      active={searchOpenToWork}
                      label={OPEN_ON_MOONS_LABEL}
                      onPress={() => setSearchOpenToWork((v) => !v)}
                    />
                  ) : null}
                  <FilterPill active={searchHiring} label="Hiring" onPress={() => setSearchHiring((v) => !v)} />
                </View>
              </View>

              {!searchActive ? (
                <NetworkTabs
                  value={tab}
                  onChange={setTab}
                  counts={{
                    connections: stats?.connections,
                    pending: stats?.pendingReceived,
                    sent: stats?.pendingSent,
                  }}
                />
              ) : (
                <Text style={[{ color: colors.heading, fontSize: 15, marginBottom: 10 }, fontStyle('bold')]}>Search results</Text>
              )}

              {!loading && !searching && !isSocialTab ? (
                <Text style={[styles.resultLabel, { color: colors.muted }, fontStyle('semibold')]}>{resultLabel}</Text>
              ) : null}

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: `${colors.error}33` }]}>
                  <Text style={{ color: colors.error, fontSize: 13, ...fontStyle('medium') }}>{error}</Text>
                </View>
              ) : null}

              {(loading || searching) && listData.length === 0 ? (
                <ActivityIndicator style={{ marginVertical: 40 }} color={colors.blue} />
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const row =
              isSocialTab && !searchActive ? (
                <NetworkListRow
                  person={item}
                  onConnectionChange={handleConnectionChange}
                  onUpdated={() => void loadTab(true)}
                  showConnect={tab !== 'pending'}
                  isLast={index === listData.length - 1}
                />
              ) : (
                <PersonCard
                  person={item}
                  onConnectionChange={handleConnectionChange}
                  onUpdated={() => void loadTab(true)}
                  showConnect={tab !== 'pending'}
                  onDismiss={
                    tab === 'suggestions' && !searchActive
                      ? () => setSuggestions((prev) => prev.filter((p) => p.userId !== item.userId))
                      : undefined
                  }
                />
              );

            if (!isSocialTab || searchActive) return row;

            const isFirst = index === 0;
            const isLast = index === listData.length - 1;
            return (
              <View
                style={[
                  styles.socialListItem,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  isFirst && styles.socialListFirst,
                  isLast && styles.socialListLast,
                  isLast && !isFirst && styles.socialListLastOnly,
                ]}
              >
                {row}
              </View>
            );
          }}
          ListEmptyComponent={
            !loading && !searching ? (
              <EmptyState icon="people-outline" title={emptyState.title} message={emptyState.message} />
            ) : null
          }
        />
      </AuthenticatedScreen>
    </AppScreen>
  );
}

function StatItem({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: number;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.statItem}>
      <Text style={[{ color: colors.heading, fontSize: 20 }, fontStyle('bold')]}>{value}</Text>
      <Text
        style={[
          { fontSize: 12, marginTop: 2 },
          active ? { color: colors.blue, ...fontStyle('bold') } : { color: colors.muted, ...fontStyle('semibold') },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.md },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadow.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  socialListItem: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: theme.spacing.md,
  },
  socialListFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingTop: 4,
  },
  socialListLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    paddingBottom: 4,
  },
  socialListLastOnly: {
    borderTopWidth: 1,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingTop: 4,
  },
  searchPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    gap: 10,
  },
  searchSection: { marginTop: 4 },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: -4,
    marginBottom: theme.spacing.sm,
  },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  searchBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  filterRow: { flexDirection: 'row', gap: 8 },
  roleFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  filterPillText: { fontSize: 12 },
  resultLabel: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 12,
  },
});
