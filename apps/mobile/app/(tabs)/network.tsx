import { UserRole } from '@moons/shared';

import { useFocusEffect } from 'expo-router';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {

  ActivityIndicator,

  FlatList,

  Pressable,

  RefreshControl,

  StyleSheet,

  Text,

  useWindowDimensions,

  View,

} from 'react-native';

import { AppScreen } from '@/components/app-screen';

import { AuthenticatedScreen } from '@/components/authenticated-screen';

import { PersonCard, type ConnectionUpdate } from '@/components/network/person-card';

import { NetworkTabs, type NetworkTabId } from '@/components/network/network-tabs';

import { EmptyState, ScreenHeader } from '@/components/portal-ui';

import { SearchBar } from '@/components/search-bar';

import { ApiError } from '@/lib/api';

import { useAuth } from '@/lib/auth-context';

import {

  fetchRecentConnections,

  fetchSuggestions,

  searchProfessionals,

  type ConnectionListItem,

} from '@/lib/network';

import type { NetworkUserCard } from '@moons/shared';

import { fontStyle } from '@/lib/font-style';

import { useTheme } from '@/lib/theme-context';

import { theme } from '@/lib/theme';



export default function NetworkScreen() {

  const { user } = useAuth();

  const { colors } = useTheme();

  const { width } = useWindowDimensions();

  const compact = width < 380;

  const isRecruiter = user?.role === UserRole.RECRUITER;

  const [tab, setTab] = useState<NetworkTabId>('suggestions');

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<NetworkUserCard[]>([]);

  const [recent, setRecent] = useState<ConnectionListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [searchActive, setSearchActive] = useState(false);

  const [searchResults, setSearchResults] = useState<NetworkUserCard[]>([]);

  const [searching, setSearching] = useState(false);



  const loadTab = useCallback(async (isRefresh = false) => {

    if (searchActive) return;

    if (isRefresh) setRefreshing(true);

    else setLoading(true);

    setError('');

    try {

      if (tab === 'suggestions') {

        const data = await fetchSuggestions();

        setSuggestions(data.items);

      } else {

        setRecent(await fetchRecentConnections());

      }

    } catch (err) {

      setError(err instanceof ApiError ? err.message : 'Failed to load network');

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [tab, searchActive]);



  useFocusEffect(

    useCallback(() => {

      void loadTab();

    }, [loadTab]),

  );



  useEffect(() => {

    if (!searchActive) void loadTab();

  }, [tab, searchActive, loadTab]);



  function handleConnectionChange(userId: string, update: ConnectionUpdate) {

    const patch = (list: NetworkUserCard[]) =>

      list.map((p) =>

        p.userId === userId

          ? {

              ...p,

              connectionStatus: update.connectionStatus,

              connectionId: update.connectionId || null,

              connectionDirection: update.connectionDirection,

            }

          : p,

      );

    setSuggestions(patch);

    setSearchResults(patch);

  }



  function clearSearch() {

    setSearchActive(false);

    setSearchResults([]);

    setSearchQuery('');

    setError('');

  }



  async function runSearch() {

    const q = searchQuery.trim();

    if (!q) {

      clearSearch();

      return;

    }

    setSearching(true);

    setSearchActive(true);

    setError('');

    try {

      const data = await searchProfessionals({ q });

      setSearchResults(data.items);

    } catch (err) {

      setError(err instanceof ApiError ? err.message : 'Search failed');

    } finally {

      setSearching(false);

    }

  }



  const listData: NetworkUserCard[] = searchActive

    ? searchResults

    : tab === 'suggestions'

      ? suggestions

      : recent.map((r) => ({ ...r.user, connectionStatus: 'ACCEPTED', connectionId: r.connectionId }));



  const emptyState = useMemo(() => {

    if (searchActive) {

      return {

        title: 'No professionals found',

        message: 'Try a different name, skill, or company keyword.',

      };

    }

    if (tab === 'recent') {

      return {

        title: 'No connections yet',

        message: 'When you connect with someone, they will appear here.',

      };

    }

    return {

      title: 'No suggestions yet',

      message: 'Complete your profile for better recommendations.',

    };

  }, [searchActive, tab]);



  const resultLabel = searchActive

    ? `${listData.length} result${listData.length === 1 ? '' : 's'}`

    : tab === 'suggestions'

      ? `${listData.length} suggestion${listData.length === 1 ? '' : 's'}`

      : `${listData.length} connection${listData.length === 1 ? '' : 's'}`;



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



              <View style={styles.searchSection}>

                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name, skills, company…"
                  onSubmitEditing={() => void runSearch()}
                />

                <View style={styles.searchActions}>

                  {searchActive ? (

                    <Pressable onPress={clearSearch} style={styles.clearBtn}>

                      <Text style={{ color: colors.muted, ...fontStyle('semibold'), fontSize: 13 }}>Clear</Text>

                    </Pressable>

                  ) : null}

                  <Pressable

                    onPress={() => void runSearch()}

                    style={[styles.searchBtn, { backgroundColor: colors.blue }]}

                  >

                    <Text style={{ color: '#fff', ...fontStyle('bold'), fontSize: 14 }}>Search</Text>

                  </Pressable>

                </View>

              </View>



              {!searchActive ? (

                <NetworkTabs value={tab} onChange={setTab} compact={compact} />

              ) : null}



              {!loading && !searching ? (

                <Text style={[styles.resultLabel, { color: colors.muted }, fontStyle('semibold')]}>

                  {resultLabel}

                </Text>

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

          renderItem={({ item }) => (

            <PersonCard

              person={item}

              onConnectionChange={handleConnectionChange}

              onDismiss={

                tab === 'suggestions' && !searchActive

                  ? () => setSuggestions((prev) => prev.filter((p) => p.userId !== item.userId))

                  : undefined

              }

            />

          )}

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



const styles = StyleSheet.create({

  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.md },

  searchSection: { marginBottom: 4 },

  searchActions: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'flex-end',

    gap: 10,

    marginTop: -4,

    marginBottom: theme.spacing.sm,

  },

  clearBtn: { paddingHorizontal: 8, paddingVertical: 8 },

  searchBtn: {

    paddingHorizontal: 20,

    paddingVertical: 10,

    borderRadius: 999,

  },

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


