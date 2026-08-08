import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SuggestionsList } from '@/components/jobs/suggestions-list';
import {
  fetchSearchSuggestions,
  type SearchSuggestion,
} from '@/lib/search-suggestions';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function JobsSearchHero({
  query,
  onQueryChange,
  onSearch,
  onOpenFilters,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onSearch?: () => void;
  onOpenFilters?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [queryFocused, setQueryFocused] = useState(false);
  const [querySuggestions, setQuerySuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingQuerySuggestions, setLoadingQuerySuggestions] = useState(false);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!queryFocused) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLoadingQuerySuggestions(true);
      const timer = setTimeout(() => {
        void fetchSearchSuggestions('')
          .then(setQuerySuggestions)
          .finally(() => setLoadingQuerySuggestions(false));
      }, 100);
      return () => clearTimeout(timer);
    }

    setLoadingQuerySuggestions(true);
    const timer = setTimeout(() => {
      void fetchSearchSuggestions(trimmed)
        .then(setQuerySuggestions)
        .catch(() => setQuerySuggestions([]))
        .finally(() => setLoadingQuerySuggestions(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, queryFocused]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: theme.spacing.md,
          zIndex: 2,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        field: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 50,
          backgroundColor: isDark ? colors.surfaceElevated : '#f4f7fb',
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
          paddingLeft: 8,
          paddingRight: 14,
          paddingVertical: 6,
        },
        fieldFocused: {
          borderColor: colors.blue,
          backgroundColor: isDark ? colors.surface : '#ffffff',
        },
        searchIcon: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? `${colors.blue}22` : `${colors.blue}14`,
        },
        input: {
          flex: 1,
          fontSize: 15,
          lineHeight: 20,
          color: colors.heading,
          paddingVertical: 8,
          paddingHorizontal: 0,
          ...fontStyle('regular'),
        },
        clearBtn: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? colors.surface : 'rgba(15,28,51,0.06)',
        },
        filterBtn: {
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.blue,
          shadowColor: colors.blue,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.28,
          shadowRadius: 10,
          elevation: 4,
        },
      }),
    [colors, isDark],
  );

  function focusInput() {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setQueryFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function selectQuerySuggestion(item: SearchSuggestion) {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setQueryFocused(false);
    setQuerySuggestions([]);
    Keyboard.dismiss();
    onQueryChange(item.label);
    if (item.type === 'job' && item.jobId) {
      router.push(`/job/${item.jobId}`);
      return;
    }
    if (item.type === 'company' && item.recruiterId) {
      router.push(`/companies/${item.recruiterId}`);
      return;
    }
    onSearch?.();
  }

  const showQuerySuggestions =
    queryFocused && (loadingQuerySuggestions || querySuggestions.length > 0 || query.trim().length < 2);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={focusInput}
          style={[styles.field, queryFocused && styles.fieldFocused]}
        >
          <View style={styles.searchIcon} pointerEvents="none">
            <Ionicons name="search" size={16} color={colors.blue} />
          </View>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search jobs, companies…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            returnKeyType="search"
            blurOnSubmit={false}
            showSoftInputOnFocus
            editable
            onFocus={() => {
              if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
              }
              setQueryFocused(true);
            }}
            onBlur={() => {
              blurTimerRef.current = setTimeout(() => setQueryFocused(false), 180);
            }}
            onSubmitEditing={onSearch}
            accessibilityLabel="Search jobs"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                onQueryChange('');
                focusInput();
              }}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={6}
            >
              <Ionicons name="close" size={14} color={colors.muted} />
            </Pressable>
          ) : null}
        </Pressable>

        {onOpenFilters ? (
          <Pressable
            onPress={onOpenFilters}
            style={styles.filterBtn}
            accessibilityRole="button"
            accessibilityLabel="More filters"
            hitSlop={4}
          >
            <Ionicons name="options-outline" size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      <SuggestionsList
        visible={showQuerySuggestions}
        loading={loadingQuerySuggestions}
        items={querySuggestions}
        onSelect={selectQuerySuggestion}
        emptyMessage="No matching roles or companies"
        renderItem={(item) => ({
          title: item.label,
          subtitle: item.meta,
          icon:
            item.type === 'job'
              ? 'briefcase-outline'
              : item.type === 'company'
                ? 'business-outline'
                : 'sparkles-outline',
        })}
      />
    </View>
  );
}
