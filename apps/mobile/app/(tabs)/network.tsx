import { Ionicons } from '@expo/vector-icons';
import { UserRole, type NetworkStats, type NetworkUserCard } from '@moons/shared';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { AuthenticatedScreen } from '@/components/authenticated-screen';
import { NetworkDetailHeader, NetworkSegmentTabs } from '@/components/network/network-detail-header';
import { NetworkInviteRow } from '@/components/network/network-invite-row';
import { NetworkListRow } from '@/components/network/network-list-row';
import { NetworkStatCard } from '@/components/network/network-stat-card';
import { PersonCard, type ConnectionUpdate } from '@/components/network/person-card';
import { SuggestionDiscoveryCard } from '@/components/network/suggestion-discovery-card';
import { EmptyState } from '@/components/portal-ui';
import { SearchBar } from '@/components/search-bar';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import {
  fetchConnections,
  fetchNetworkStats,
  fetchPendingReceived,
  fetchPendingSent,
  fetchSuggestions,
  searchProfessionals,
  type ConnectionListItem,
  type PendingRequestItem,
} from '@/lib/network';
import { useNavChromeScrollProps } from '@/lib/nav-chrome';
import { useNavIndicators } from '@/lib/nav-indicators';
import { subscribeRefresh } from '@/lib/refresh-events';
import { useTabScreenPadding, useTabScreenTopPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

type ViewMode = 'home' | 'invitations' | 'connections' | 'suggestions' | 'search';
type InviteSegment = 'received' | 'sent';

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

function SectionHeader({
  title,
  count,
  badge = false,
  onSeeAll,
}: {
  title: string;
  count?: number;
  /** Red alert badge (use for invitations only). */
  badge?: boolean;
  onSeeAll?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
          {title}
        </Text>
        {badge && typeof count === 'number' && count > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: '#ef4444' }]}>
            <Text style={[styles.countBadgeText, fontStyle('bold')]}>{count > 99 ? '99+' : count}</Text>
          </View>
        ) : null}
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={10} style={styles.seeAllBtn}>
          <Text style={[styles.seeAll, { color: colors.muted }, fontStyle('medium')]}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function NetworkScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const bottomPadding = useTabScreenPadding();
  const topPadding = useTabScreenTopPadding();
  const navScroll = useNavChromeScrollProps();
  const { acknowledgeNetworkBadge } = useNavIndicators();
  const params = useLocalSearchParams<{ tab?: string; q?: string | string[] }>();

  const paramQ = useMemo(() => {
    const raw = params.q;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value?.trim() || '';
  }, [params.q]);

  const initialView = useMemo<ViewMode>(() => {
    const raw = typeof params.tab === 'string' ? params.tab : '';
    if (raw === 'search' || paramQ) return 'search';
    if (raw === 'suggestions') return 'suggestions';
    if (raw === 'sent' || raw === 'pending') return 'invitations';
    if (raw === 'recent' || raw === 'connections') return 'connections';
    return 'home';
  }, [params.tab, paramQ]);

  const initialInviteSegment = useMemo<InviteSegment>(() => {
    const raw = typeof params.tab === 'string' ? params.tab : '';
    return raw === 'sent' ? 'sent' : 'received';
  }, [params.tab]);

  const [view, setView] = useState<ViewMode>(initialView);
  const [inviteSegment, setInviteSegment] = useState<InviteSegment>(initialInviteSegment);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<NetworkStats | null>(null);

  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [pending, setPending] = useState<PendingRequestItem[]>([]);
  const [sent, setSent] = useState<PendingRequestItem[]>([]);
  const [suggestions, setSuggestions] = useState<NetworkUserCard[]>([]);

  const [searchQuery, setSearchQuery] = useState(paramQ);
  const [searchResults, setSearchResults] = useState<NetworkUserCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [connectionsFilter, setConnectionsFilter] = useState('');

  useEffect(() => {
    setView(initialView);
    setInviteSegment(initialInviteSegment);
  }, [initialView, initialInviteSegment]);

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const settled = await Promise.allSettled([
        fetchNetworkStats(),
        fetchConnections(),
        fetchPendingReceived(),
        fetchPendingSent(),
        fetchSuggestions(1, 24),
        // Recruiters browse the full (non-private) people pool — not only scored suggestions.
        isRecruiter
          ? searchProfessionals({ page: 1, limit: 50 })
          : Promise.resolve({ items: [] as NetworkUserCard[], total: 0, page: 1, limit: 50, totalPages: 1 }),
      ]);

      const nextStats = settled[0].status === 'fulfilled' ? settled[0].value : null;
      const connData = settled[1].status === 'fulfilled' ? settled[1].value : { items: [] as ConnectionListItem[] };
      const received = settled[2].status === 'fulfilled' ? settled[2].value : { items: [] as PendingRequestItem[] };
      const outgoing = settled[3].status === 'fulfilled' ? settled[3].value : { items: [] as PendingRequestItem[] };
      const suggestionData =
        settled[4].status === 'fulfilled' ? settled[4].value : { items: [] as NetworkUserCard[] };
      const discoverData =
        settled[5].status === 'fulfilled' ? settled[5].value : { items: [] as NetworkUserCard[] };

      setStats(nextStats);
      setConnections(connData.items);
      setPending(received.items);
      setSent(outgoing.items);

      const connectedIds = new Set(connData.items.map((c) => c.user.userId));
      const pendingIds = new Set([
        ...received.items.map((i) => i.fromUser?.userId).filter(Boolean),
        ...outgoing.items.map((i) => i.toUser?.userId).filter(Boolean),
      ] as string[]);

      if (isRecruiter && discoverData.items.length > 0) {
        const browsable = discoverData.items.filter(
          (person) =>
            person.userId !== user?.id &&
            !connectedIds.has(person.userId) &&
            !pendingIds.has(person.userId),
        );
        // Prefer the broad browse pool for recruiters so Network isn't empty.
        setSuggestions(browsable.length > 0 ? browsable : suggestionData.items);
      } else {
        setSuggestions(suggestionData.items);
      }

      if (settled.some((r) => r.status === 'rejected')) {
        const firstError = settled.find((r) => r.status === 'rejected') as PromiseRejectedResult;
        const message =
          firstError.reason instanceof ApiError
            ? firstError.reason.message
            : firstError.reason instanceof Error
              ? firstError.reason.message
              : '';
        if (message && !nextStats && connData.items.length === 0 && suggestionData.items.length === 0) {
          setError(message || 'Failed to load network');
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load network');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isRecruiter, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
      void (async () => {
        try {
          const nextStats = await fetchNetworkStats();
          setStats(nextStats);
          await acknowledgeNetworkBadge(nextStats.pendingReceived);
        } catch {
          // ignore
        }
      })();
    }, [loadAll, acknowledgeNetworkBadge]),
  );

  useEffect(() => {
    const unsub = subscribeRefresh('moons:connections-refresh', () => {
      void loadAll(true);
    });
    return unsub;
  }, [loadAll]);

  function handleConnectionChange(userId: string, update: ConnectionUpdate) {
    if (
      update.connectionStatus === 'ACCEPTED' ||
      update.connectionStatus === 'NONE' ||
      update.connectionStatus === 'REJECTED'
    ) {
      setPending((prev) => prev.filter((item) => item.fromUser?.userId !== userId));
      setSent((prev) => prev.filter((item) => item.toUser?.userId !== userId));
      if (update.connectionStatus === 'ACCEPTED') {
        setSuggestions((prev) => prev.filter((p) => p.userId !== userId));
      } else {
        setSuggestions((prev) =>
          prev.map((p) =>
            p.userId === userId
              ? {
                  ...p,
                  connectionStatus: 'NONE',
                  connectionId: null,
                  connectionDirection: null,
                }
              : p,
          ),
        );
      }
      if (update.connectionStatus !== 'ACCEPTED') {
        setConnections((prev) => prev.filter((c) => c.user.userId !== userId));
      }
    } else {
      setSuggestions((prev) => applyConnectionUpdate(prev, userId, update));
    }
    setSearchResults((prev) => applyConnectionUpdate(prev, userId, update));
    void fetchNetworkStats()
      .then(setStats)
      .catch(() => undefined);
  }

  async function runSearch(nextQuery?: string) {
    const q = (nextQuery ?? searchQuery).trim();
    if (!q) {
      setView('home');
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setView('search');
    setError('');
    try {
      const data = await searchProfessionals({
        q,
        page: 1,
        limit: 50,
      });
      setSearchResults(data.items);
      if (data.items.length === 0 && q.includes(' ')) {
        // Fallback: try the longest token alone (helps typos like "ansh kaushik").
        const tokens = q.split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length);
        if (tokens[0] && tokens[0].length >= 3) {
          const retry = await searchProfessionals({ q: tokens[0], page: 1, limit: 50 });
          setSearchResults(retry.items);
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!paramQ) return;
    setSearchQuery(paramQ);
    setView('search');
    void runSearch(paramQ);
    // Intentional: only re-run when deep-link query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramQ]);

  const receivedInvites = useMemo(
    () =>
      pending
        .filter((item) => item.fromUser)
        .map((item) => ({
          id: item.id,
          person: {
            ...item.fromUser!,
            connectionStatus: 'PENDING' as const,
            connectionId: item.id,
            connectionDirection: 'received' as const,
          },
        })),
    [pending],
  );

  const sentInvites = useMemo(
    () =>
      sent
        .filter((item) => item.toUser)
        .map((item) => ({
          id: item.id,
          person: {
            ...item.toUser!,
            connectionStatus: 'PENDING' as const,
            connectionId: item.id,
            connectionDirection: 'sent' as const,
          },
        })),
    [sent],
  );

  const connectionPeople = useMemo(
    () =>
      connections.map((r) => ({
        ...r.user,
        connectionStatus: 'ACCEPTED' as const,
        connectionId: r.connectionId,
      })),
    [connections],
  );

  const invitePreview = receivedInvites.slice(0, 3);
  const suggestionPreview = suggestions.slice(0, 12);

  const activeInvites = inviteSegment === 'received' ? receivedInvites : sentInvites;

  const filteredConnections = useMemo(() => {
    const q = connectionsFilter.trim().toLowerCase();
    if (!q) return connectionPeople;
    return connectionPeople.filter((person) => {
      const hay = [person.fullName, person.headline, person.currentCompany, person.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [connectionPeople, connectionsFilter]);

  const pageBg = isDark ? colors.background : '#F3F6FB';

  function openInvitations(segment: InviteSegment = 'received') {
    setInviteSegment(segment);
    setView('invitations');
  }

  function openConnections() {
    setConnectionsFilter('');
    setView('connections');
  }

  if (loading && !refreshing) {
    return (
      <AppScreen>
        <AuthenticatedScreen padBottom={false}>
          <View style={[styles.centered, { backgroundColor: pageBg }]}>
            <ActivityIndicator size="large" color={colors.blue} />
          </View>
        </AuthenticatedScreen>
      </AppScreen>
    );
  }

  const listData =
    view === 'home'
      ? [{ id: 'home' as const }]
      : view === 'invitations'
        ? [{ id: 'invite-list' as const }]
        : view === 'connections'
          ? [{ id: 'connections-list' as const }]
          : view === 'suggestions'
            ? suggestions.map((p) => ({ id: p.userId, person: p }))
            : searchResults.map((p) => ({ id: p.userId, person: p }));

  const showBack = view !== 'home';

  return (
    <AppScreen>
      <AuthenticatedScreen padBottom={false}>
        <FlatList
          key={view === 'suggestions' ? 'suggestions-grid' : `list-${view}`}
          style={{ backgroundColor: pageBg }}
          data={listData as { id: string; person?: NetworkUserCard }[]}
          keyExtractor={(item) => item.id}
          numColumns={view === 'suggestions' ? 2 : 1}
          columnWrapperStyle={view === 'suggestions' ? styles.suggestGridRow : undefined}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPadding, paddingTop: topPadding }]}
          showsVerticalScrollIndicator={false}
          {...navScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => (view === 'search' ? void runSearch() : void loadAll(true))}
              tintColor={colors.blue}
            />
          }
          ListHeaderComponent={
            <View>
              {view === 'invitations' ? (
                <>
                  <NetworkDetailHeader
                    title="Invitations"
                    subtitle="Accept new requests or manage invites you’ve already sent."
                    count={
                      inviteSegment === 'received' ? receivedInvites.length : sentInvites.length
                    }
                    icon="mail-unread-outline"
                    onBack={() => setView('home')}
                  />
                  <NetworkSegmentTabs
                    value={inviteSegment}
                    onChange={(id) => setInviteSegment(id as InviteSegment)}
                    options={[
                      { id: 'received', label: 'Received', count: receivedInvites.length },
                      { id: 'sent', label: 'Sent', count: sentInvites.length },
                    ]}
                  />
                </>
              ) : null}

              {view === 'connections' ? (
                <>
                  <NetworkDetailHeader
                    title="Your connections"
                    subtitle="Message people in your network or open their profile."
                    count={connectionPeople.length}
                    icon="people-outline"
                    onBack={() => setView('home')}
                  />
                  <View style={styles.searchWrap}>
                    <SearchBar
                      value={connectionsFilter}
                      onChangeText={setConnectionsFilter}
                      placeholder="Filter connections…"
                    />
                  </View>
                </>
              ) : null}

              {view === 'suggestions' ? (
                <NetworkDetailHeader
                  title="People you may know"
                  subtitle="Professionals matched to your profile, skills, and mutual connections."
                  count={suggestions.length}
                  icon="sparkles-outline"
                  onBack={() => setView('home')}
                />
              ) : null}

              {showBack && view === 'search' ? (
                <Pressable onPress={() => setView('home')} style={styles.backRow} hitSlop={8}>
                  <View
                    style={[
                      styles.backBtn,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.heading} />
                  </View>
                  <Text style={[{ color: colors.heading, fontSize: 16 }, fontStyle('bold')]}>
                    Search results
                  </Text>
                </Pressable>
              ) : null}

              {view === 'home' ? (
                <>
                  <View style={styles.statsRow}>
                    <NetworkStatCard
                      icon="people-outline"
                      label="Connections"
                      value={stats?.connections ?? connectionPeople.length}
                      onPress={openConnections}
                    />
                    <NetworkStatCard
                      icon="mail-unread-outline"
                      label="Invites"
                      value={stats?.pendingReceived ?? receivedInvites.length}
                      onPress={() => openInvitations('received')}
                    />
                    <NetworkStatCard
                      icon="paper-plane-outline"
                      label="Sent"
                      value={stats?.pendingSent ?? sentInvites.length}
                      onPress={() => openInvitations('sent')}
                    />
                  </View>

                  <View style={styles.searchWrap}>
                    <SearchBar
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search professionals…"
                      onSubmitEditing={() => void runSearch()}
                    />
                  </View>

                  {error ? (
                    <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                  ) : null}

                  <SectionHeader
                    title="Invitations"
                    count={receivedInvites.length}
                    badge
                    onSeeAll={receivedInvites.length > 0 ? () => openInvitations('received') : undefined}
                  />
                  <View
                    style={[
                      styles.blockCard,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      theme.shadow.soft,
                    ]}
                  >
                    {invitePreview.length === 0 ? (
                      <Text style={[styles.emptyInline, { color: colors.muted }, fontStyle('medium')]}>
                        No pending invitations right now.
                      </Text>
                    ) : (
                      invitePreview.map((item, index) => (
                        <NetworkInviteRow
                          key={item.id}
                          person={item.person}
                          connectionId={item.id}
                          direction="received"
                          isLast={index === invitePreview.length - 1}
                          onConnectionChange={handleConnectionChange}
                          onUpdated={() => void loadAll(true)}
                        />
                      ))
                    )}
                  </View>

                  <SectionHeader
                    title="People you may know"
                    onSeeAll={suggestions.length > 0 ? () => setView('suggestions') : undefined}
                  />
                  {suggestionPreview.length === 0 ? (
                    <View
                      style={[
                        styles.blockCard,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.emptyInline, { color: colors.muted }, fontStyle('medium')]}>
                        Complete your profile for better recommendations.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      nestedScrollEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.suggestScroll}
                      contentContainerStyle={styles.suggestRow}
                    >
                      {suggestionPreview.map((person) => (
                        <SuggestionDiscoveryCard
                          key={person.userId}
                          person={person}
                          onConnectionChange={handleConnectionChange}
                          onDismiss={() =>
                            setSuggestions((prev) => prev.filter((p) => p.userId !== person.userId))
                          }
                          onUpdated={() => void loadAll(true)}
                        />
                      ))}
                    </ScrollView>
                  )}

                  <SectionHeader
                    title="Your connections"
                    onSeeAll={connectionPeople.length > 0 ? openConnections : undefined}
                  />
                </>
              ) : (
                <>
                  {view === 'search' ? (
                    <View style={styles.searchWrap}>
                      <SearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search professionals…"
                        onSubmitEditing={() => void runSearch()}
                      />
                    </View>
                  ) : null}
                  {error ? (
                    <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                  ) : null}
                  {searching ? (
                    <ActivityIndicator color={colors.blue} style={{ marginVertical: 24 }} />
                  ) : null}
                </>
              )}
            </View>
          }
          renderItem={({ item }) => {
            if (view === 'home') {
              if (connectionPeople.length === 0) {
                return (
                  <EmptyState
                    icon="people-outline"
                    title="No connections yet"
                    message="Browse suggestions above to start building your network."
                  />
                );
              }
              return (
                <View
                  style={[
                    styles.blockCard,
                    styles.connectionsPad,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    theme.shadow.soft,
                  ]}
                >
                  {connectionPeople.slice(0, 5).map((person, index) => (
                    <NetworkListRow
                      key={person.userId}
                      person={person}
                      showConnect
                      isLast={index === Math.min(connectionPeople.length, 5) - 1}
                      onConnectionChange={handleConnectionChange}
                      onUpdated={() => void loadAll(true)}
                    />
                  ))}
                </View>
              );
            }

            if (view === 'invitations') {
              if (activeInvites.length === 0) {
                return (
                  <EmptyState
                    icon={inviteSegment === 'received' ? 'mail-unread-outline' : 'paper-plane-outline'}
                    title={inviteSegment === 'received' ? 'No invitations' : 'No sent invites'}
                    message={
                      inviteSegment === 'received'
                        ? 'When someone sends you a connection invite, it will show up here.'
                        : 'Invites you send will appear here until they respond.'
                    }
                  />
                );
              }
              return (
                <View
                  style={[
                    styles.blockCard,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    theme.shadow.soft,
                  ]}
                >
                  {activeInvites.map((row, index) => (
                    <NetworkInviteRow
                      key={row.id}
                      person={row.person}
                      connectionId={row.id}
                      direction={inviteSegment}
                      isLast={index === activeInvites.length - 1}
                      onConnectionChange={handleConnectionChange}
                      onUpdated={() => void loadAll(true)}
                    />
                  ))}
                </View>
              );
            }

            if (view === 'connections') {
              if (filteredConnections.length === 0) {
                return (
                  <EmptyState
                    icon="people-outline"
                    title={connectionsFilter.trim() ? 'No matches' : 'No connections yet'}
                    message={
                      connectionsFilter.trim()
                        ? 'Try a different name, company, or headline.'
                        : 'Browse suggestions to start building your network.'
                    }
                  />
                );
              }
              return (
                <View
                  style={[
                    styles.blockCard,
                    styles.connectionsPad,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    theme.shadow.soft,
                  ]}
                >
                  {filteredConnections.map((person, index) => (
                    <NetworkListRow
                      key={person.userId}
                      person={person}
                      showConnect
                      variant="detail"
                      isLast={index === filteredConnections.length - 1}
                      onConnectionChange={handleConnectionChange}
                      onUpdated={() => void loadAll(true)}
                    />
                  ))}
                </View>
              );
            }

            const person = item.person;
            if (!person) return null;

            if (view === 'suggestions') {
              return (
                <View style={styles.suggestGridCell}>
                  <SuggestionDiscoveryCard
                    person={person}
                    layout="grid"
                    onConnectionChange={handleConnectionChange}
                    onDismiss={() =>
                      setSuggestions((prev) => prev.filter((p) => p.userId !== person.userId))
                    }
                    onUpdated={() => void loadAll(true)}
                  />
                </View>
              );
            }

            return (
              <View style={styles.personCardWrap}>
                <PersonCard
                  person={person}
                  showConnect
                  onConnectionChange={handleConnectionChange}
                  onUpdated={() => void loadAll(true)}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            view === 'search' && !loading && !searching ? (
              <EmptyState
                icon="search-outline"
                title="No professionals found"
                message="Try a different name, skill, or company keyword."
              />
            ) : view === 'suggestions' && !loading ? (
              <EmptyState
                icon="sparkles-outline"
                title="No suggestions yet"
                message="Complete your profile for better recommendations."
              />
            ) : null
          }
        />
      </AuthenticatedScreen>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: theme.spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchWrap: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 14,
    minHeight: 28,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  sectionTitle: {
    fontSize: 17,
    flexShrink: 1,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  seeAll: {
    fontSize: 12,
  },
  blockCard: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 4,
  },
  connectionsPad: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  emptyInline: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    textAlign: 'center',
  },
  suggestScroll: {
    marginHorizontal: -theme.spacing.md,
  },
  suggestRow: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 4,
    paddingTop: 2,
  },
  personCardWrap: {
    marginBottom: 10,
  },
  suggestGridRow: {
    gap: 10,
    marginBottom: 10,
  },
  suggestGridCell: {
    flex: 1,
  },
  error: {
    fontSize: 13,
    marginBottom: 10,
  },
});
