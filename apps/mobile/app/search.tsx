import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { fontStyle } from '@/lib/font-style';
import {
  fetchSearchSuggestions,
  getPopularSuggestions,
  type SearchSuggestion,
} from '@/lib/search-suggestions';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function typeMeta(type: SearchSuggestion['type']) {
  switch (type) {
    case 'job':
      return { label: 'Job', icon: 'briefcase-outline' as const };
    case 'company':
      return { label: 'Company', icon: 'business-outline' as const };
    case 'person':
      return { label: 'People', icon: 'person-outline' as const };
    case 'skill':
      return { label: 'Search', icon: 'search-outline' as const };
    default:
      return { label: 'Search', icon: 'search-outline' as const };
  }
}

export default function UniversalSearchScreen() {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>(() => getPopularSuggestions());

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, padding: theme.spacing.md },
        searchWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
          borderRadius: theme.radius.full,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 14,
        },
        input: {
          flex: 1,
          fontSize: 16,
          padding: 0,
          ...fontStyle('regular'),
        },
        sectionLabel: {
          fontSize: 12,
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          ...fontStyle('semibold'),
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderRadius: theme.radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 8,
        },
        iconBubble: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rowCopy: { flex: 1, minWidth: 0 },
        rowTitle: { fontSize: 15, ...fontStyle('semibold') },
        rowMeta: { fontSize: 12, marginTop: 2 },
        typeChip: {
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        typeChipText: { fontSize: 10, ...fontStyle('bold') },
        footerBtn: {
          marginTop: 8,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          paddingVertical: 14,
          alignItems: 'center',
        },
        empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
      }),
    [],
  );

  const load = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions(getPopularSuggestions());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await fetchSearchSuggestions(trimmed);
      setSuggestions(next);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(query), query.trim().length >= 2 ? 280 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);

  function openSuggestion(item: SearchSuggestion) {
    Keyboard.dismiss();
    if (item.type === 'job' && item.jobId) {
      router.push(`/job/${item.jobId}` as never);
      return;
    }
    if (item.type === 'company' && item.recruiterId) {
      router.push(`/companies/${item.recruiterId}` as never);
      return;
    }
    if (item.type === 'person' && item.userId) {
      router.push(`/network/${item.userId}` as never);
      return;
    }
    router.push({ pathname: '/(tabs)/jobs', params: { q: item.label } } as never);
  }

  function searchAllJobs() {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    router.push({ pathname: '/(tabs)/jobs', params: { q } } as never);
  }

  const sectionTitle = query.trim().length < 2 ? 'Popular searches' : 'Suggestions';

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={[styles.searchWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.blue} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search jobs, people, companies…"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.heading }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={searchAllJobs}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{sectionTitle}</Text>

        {loading ? (
          <ActivityIndicator color={colors.blue} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.type}-${item.label}-${index}`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.muted }]}>
                No matches yet. Try a different name, skill, or company.
              </Text>
            }
            renderItem={({ item }) => {
              const meta = typeMeta(item.type);
              return (
                <Pressable
                  onPress={() => openSuggestion(item)}
                  style={[
                    styles.row,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.iconBubble, { backgroundColor: `${colors.blue}18` }]}>
                    <Ionicons name={meta.icon} size={18} color={colors.blue} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: colors.heading }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.meta ? (
                      <Text style={[styles.rowMeta, { color: colors.muted }]} numberOfLines={1}>
                        {item.meta}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.typeChip, { backgroundColor: `${colors.blue}14` }]}>
                    <Text style={[styles.typeChipText, { color: colors.blue }]}>{meta.label}</Text>
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={
              query.trim().length >= 2 ? (
                <Pressable
                  onPress={searchAllJobs}
                  style={[styles.footerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Text style={{ color: colors.heading, ...fontStyle('semibold') }}>
                    Search all jobs for “{query.trim()}”
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )}
      </View>
    </AppScreen>
  );
}
