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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '@/components/app-screen';
import { fontStyle } from '@/lib/font-style';
import {
  fetchSearchSuggestions,
  filterSuggestionsByScope,
  getPopularSuggestions,
  type SearchScope,
  type SearchSuggestion,
} from '@/lib/search-suggestions';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

type Scope = SearchScope;

const SCOPES: { id: Scope; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'sparkles-outline' },
  { id: 'job', label: 'Jobs', icon: 'briefcase-outline' },
  { id: 'person', label: 'People', icon: 'people-outline' },
  { id: 'company', label: 'Companies', icon: 'business-outline' },
];

function typeMeta(type: SearchSuggestion['type']) {
  switch (type) {
    case 'job':
      return { label: 'Job', icon: 'briefcase-outline' as const };
    case 'company':
      return { label: 'Company', icon: 'business-outline' as const };
    case 'person':
      return { label: 'People', icon: 'person-outline' as const };
    case 'skill':
      return { label: 'Keyword', icon: 'search-outline' as const };
    default:
      return { label: 'Search', icon: 'search-outline' as const };
  }
}

export default function UniversalSearchScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>(() => getPopularSuggestions(8));
  const [error, setError] = useState('');

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const loadSeq = useRef(0);

  const load = useCallback(async (value: string, activeScope: Scope) => {
    const trimmed = value.trim();
    const seq = ++loadSeq.current;

    if (trimmed.length < 2) {
      if (seq !== loadSeq.current) return;
      setSuggestions(getPopularSuggestions(8));
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const next = await fetchSearchSuggestions(trimmed, activeScope);
      // Ignore outdated responses when the user types/switches scope quickly.
      if (seq !== loadSeq.current) return;
      setSuggestions(next);
      if (next.length === 0) {
        const emptyByScope =
          activeScope === 'job'
            ? 'No matching jobs. Try a different role or keyword.'
            : activeScope === 'person'
              ? 'No matching people. Try a different name.'
              : activeScope === 'company'
                ? 'No matching companies. Try a different company name.'
                : 'No matches found. Try a different keyword.';
        setError(emptyByScope);
      }
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setSuggestions([]);
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => void load(query, scope),
      query.trim().length >= 2 ? 280 : 0,
    );
    return () => clearTimeout(timer);
  }, [query, scope, load]);

  useEffect(() => {
    const timer = setTimeout(() => focusInput(), 250);
    return () => clearTimeout(timer);
  }, [focusInput]);

  const trimmedQuery = query.trim();
  const isPopular = trimmedQuery.length < 2;

  // Scope is applied in the API for typed searches; still filter for safety + popular mode.
  const visibleSuggestions = useMemo(
    () => filterSuggestionsByScope(suggestions, scope, { isPopular }),
    [suggestions, scope, isPopular],
  );

  function openSuggestion(item: SearchSuggestion) {
    // Concrete matches always go to their destination page.
    if (item.type === 'job' && item.jobId) {
      Keyboard.dismiss();
      router.push(`/job/${item.jobId}` as never);
      return;
    }
    if (item.type === 'company' && item.recruiterId) {
      Keyboard.dismiss();
      router.push(`/companies/${item.recruiterId}` as never);
      return;
    }
    if (item.type === 'person' && item.userId) {
      Keyboard.dismiss();
      router.push(`/network/${item.userId}` as never);
      return;
    }

    // Keywords / loose labels follow the active tab.
    if (scope === 'all') {
      // Stay on universal search and refine suggestions only (useEffect reloads via setQuery).
      setQuery(item.label);
      focusInput();
      return;
    }

    submitScopedSearch(item.label);
  }

  /**
   * Enter / footer submit:
   * - All → stay here and show mixed suggestions
   * - Jobs / People / Companies → open that section with the query
   */
  function submitScopedSearch(rawQuery?: string) {
    const q = (rawQuery ?? trimmedQuery).trim();
    if (!q) return;

    if (scope === 'all') {
      setQuery(q);
      // useEffect debounces load(query, scope) — avoid a double fetch here.
      focusInput();
      return;
    }

    Keyboard.dismiss();

    if (scope === 'job') {
      router.push({ pathname: '/(tabs)/jobs', params: { q } } as never);
      return;
    }
    if (scope === 'person') {
      router.push({ pathname: '/(tabs)/network', params: { q, tab: 'search' } } as never);
      return;
    }
    if (scope === 'company') {
      router.push({ pathname: '/(tabs)/companies', params: { q } } as never);
    }
  }

  const sectionTitle = isPopular
    ? scope === 'person'
      ? 'Search people'
      : scope === 'company'
        ? 'Search companies'
        : scope === 'job'
          ? 'Popular job keywords'
          : 'Popular on MoonsJob'
    : scope === 'job'
      ? 'Matching jobs'
      : scope === 'person'
        ? 'Matching people'
        : scope === 'company'
          ? 'Matching companies'
          : 'Top matches';

  const submitFooter =
    trimmedQuery.length >= 2
      ? scope === 'job'
        ? { icon: 'briefcase-outline' as const, label: `Search jobs for “${trimmedQuery}”` }
        : scope === 'person'
          ? { icon: 'people-outline' as const, label: `Search people for “${trimmedQuery}”` }
          : scope === 'company'
            ? { icon: 'business-outline' as const, label: `Search companies for “${trimmedQuery}”` }
            : { icon: 'search-outline' as const, label: `Update results for “${trimmedQuery}”` }
      : null;

  return (
    <AppScreen>
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)' as never);
            }}
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
                borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
              },
            ]}
            accessibilityLabel="Go back"
            hitSlop={6}
          >
            <Ionicons name="chevron-back" size={22} color={colors.blue} />
          </Pressable>

          <Pressable
            onPress={focusInput}
            style={[
              styles.searchField,
              {
                backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
                borderColor: focused ? colors.blue : isDark ? colors.border : 'rgba(15,28,51,0.06)',
              },
            ]}
          >
            <View style={[styles.searchIcon, { backgroundColor: `${colors.blue}14` }]} pointerEvents="none">
              <Ionicons name="search" size={16} color={colors.blue} />
            </View>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search jobs, people, companies…"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.heading }, fontStyle('regular')]}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              returnKeyType="search"
              blurOnSubmit={false}
              showSoftInputOnFocus
              editable
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={() => submitScopedSearch()}
              accessibilityLabel="Universal search"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery('');
                  focusInput();
                }}
                style={[styles.clearBtn, { backgroundColor: isDark ? colors.surface : 'rgba(15,28,51,0.06)' }]}
                accessibilityLabel="Clear search"
                hitSlop={6}
              >
                <Ionicons name="close" size={14} color={colors.muted} />
              </Pressable>
            ) : null}
          </Pressable>
        </View>

        <Text style={[styles.eyebrow, { color: colors.blue }, fontStyle('semibold')]}>MoonsJob Search</Text>
        <Text style={[styles.headline, { color: colors.heading }, fontStyle('bold')]}>
          Find roles, people & companies
        </Text>

        <View style={styles.scopes}>
          {SCOPES.map((item) => {
            const active = scope === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setScope(item.id)}
                style={[
                  styles.scopeChip,
                  {
                    backgroundColor: active ? colors.blue : isDark ? colors.surfaceElevated : '#ffffff',
                    borderColor: active ? colors.blue : isDark ? colors.border : 'rgba(15,28,51,0.06)',
                  },
                ]}
              >
                <Ionicons name={item.icon} size={14} color={active ? '#fff' : colors.muted} />
                <Text
                  style={[
                    styles.scopeLabel,
                    { color: active ? '#fff' : colors.heading },
                    active ? fontStyle('semibold') : fontStyle('medium'),
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('semibold')]}>
            {sectionTitle}
          </Text>
          {loading ? <ActivityIndicator size="small" color={colors.blue} /> : null}
        </View>

        {error && !loading && visibleSuggestions.length === 0 ? (
          <Text style={[styles.errorText, { color: colors.error }, fontStyle('medium')]}>{error}</Text>
        ) : null}

        <FlatList
          style={styles.list}
          data={visibleSuggestions}
          keyExtractor={(item, index) => `${item.type}-${item.label}-${index}`}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
            visibleSuggestions.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.blue} style={{ marginTop: 32 }} />
            ) : (
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIcon, { backgroundColor: `${colors.blue}12` }]}>
                  <Ionicons
                    name={
                      scope === 'person'
                        ? 'people-outline'
                        : scope === 'company'
                          ? 'business-outline'
                          : scope === 'job'
                            ? 'briefcase-outline'
                            : 'search-outline'
                    }
                    size={22}
                    color={colors.blue}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.heading }, fontStyle('semibold')]}>
                  {isPopular && (scope === 'person' || scope === 'company')
                    ? `Type to find ${scope === 'person' ? 'people' : 'companies'}`
                    : 'No matches yet'}
                </Text>
                <Text style={[styles.emptyCopy, { color: colors.muted }, fontStyle('regular')]}>
                  {isPopular && scope === 'person'
                    ? 'Enter a name or headline to search professionals on MoonsJob.'
                    : isPopular && scope === 'company'
                      ? 'Enter a company name or industry to search.'
                      : 'Try another keyword, skill, company name, or person.'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const meta = typeMeta(item.type);
            return (
              <Pressable
                onPress={() => openSuggestion(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
                    borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={[styles.iconBubble, { backgroundColor: `${colors.blue}14` }]}>
                  <Ionicons name={meta.icon} size={18} color={colors.blue} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: colors.heading }, fontStyle('semibold')]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.meta ? (
                    <Text style={[styles.rowMeta, { color: colors.muted }, fontStyle('regular')]} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  ) : (
                    <Text style={[styles.rowMeta, { color: colors.muted }, fontStyle('regular')]}>
                      {meta.label}
                    </Text>
                  )}
                </View>
                <View style={[styles.typeChip, { backgroundColor: `${colors.blue}12` }]}>
                  <Text style={[styles.typeChipText, { color: colors.blue }, fontStyle('bold')]}>{meta.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            );
          }}
          ListFooterComponent={
            submitFooter ? (
              <Pressable
                onPress={() => submitScopedSearch()}
                style={[styles.footerBtn, { backgroundColor: colors.blue }]}
              >
                <Ionicons name={submitFooter.icon} size={18} color="#fff" />
                <Text style={[styles.footerText, fontStyle('semibold')]} numberOfLines={1}>
                  {submitFooter.label}
                </Text>
              </Pressable>
            ) : null
          }
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 5,
  },
  searchIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 14,
  },
  scopes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scopeLabel: {
    fontSize: 13,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 22,
  },
  sectionTitle: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 8,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    flexGrow: 1,
  },
  listEmpty: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, lineHeight: 20 },
  rowMeta: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  typeChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeChipText: { fontSize: 10, letterSpacing: 0.2 },
  footerBtn: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    flexShrink: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 16 },
  emptyCopy: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
