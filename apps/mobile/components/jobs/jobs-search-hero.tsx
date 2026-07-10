import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SelectField } from '@/components/profile/select-field';
import { SuggestionsList } from '@/components/jobs/suggestions-list';
import { EXPERIENCE_FILTER_OPTIONS } from '@/lib/experience-options';
import {
  fetchLocationSuggestions,
  type LocationSuggestion,
} from '@/lib/location-suggestions';
import {
  fetchSearchSuggestions,
  type SearchSuggestion,
} from '@/lib/search-suggestions';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function JobsSearchHero({
  query,
  location,
  experience,
  jobCount,
  onQueryChange,
  onLocationChange,
  onExperienceChange,
  onSearch,
}: {
  query: string;
  location: string;
  experience: string;
  jobCount: number;
  onQueryChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onExperienceChange: (v: string) => void;
  onSearch?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [queryFocused, setQueryFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [querySuggestions, setQuerySuggestions] = useState<SearchSuggestion[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [loadingQuerySuggestions, setLoadingQuerySuggestions] = useState(false);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);

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

  useEffect(() => {
    if (!locationFocused) return;

    const trimmed = location.trim();
    if (trimmed.length < 2) {
      setLocationSuggestions([]);
      setLoadingLocationSuggestions(false);
      return;
    }

    setLoadingLocationSuggestions(true);
    const timer = setTimeout(() => {
      void fetchLocationSuggestions(trimmed)
        .then(setLocationSuggestions)
        .catch(() => setLocationSuggestions([]))
        .finally(() => setLoadingLocationSuggestions(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [location, locationFocused]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginHorizontal: -theme.spacing.md,
          marginBottom: theme.spacing.md,
          overflow: 'hidden',
        },
        gradient: {
          paddingTop: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
          backgroundColor: isDark ? `${colors.blue}14` : `${colors.blue}0c`,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        },
        eyebrow: {
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: colors.blue,
          marginBottom: 6,
          ...fontStyle('bold'),
        },
        title: {
          fontSize: 26,
          lineHeight: 32,
          color: colors.heading,
          ...fontStyle('extrabold'),
        },
        subtitle: {
          marginTop: 6,
          fontSize: 14,
          lineHeight: 20,
          color: colors.muted,
          ...fontStyle('regular'),
        },
        statPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: isDark ? `${colors.blue}20` : `${colors.blue}14`,
          borderRadius: theme.radius.full,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: `${colors.blue}33`,
        },
        statText: { fontSize: 12, color: colors.blue, ...fontStyle('bold') },
        searchCard: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.md,
          ...theme.shadow.card,
        },
        field: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        fieldFocused: {
          borderColor: colors.blue,
        },
        input: {
          flex: 1,
          fontSize: 15,
          color: colors.foreground,
          padding: 0,
          ...fontStyle('regular'),
        },
        fieldWrap: { marginBottom: 10 },
        searchBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.blue,
          borderRadius: theme.radius.md,
          paddingVertical: 13,
          marginTop: 4,
        },
        searchBtnText: { color: '#fff', fontSize: 15, ...fontStyle('bold') },
      }),
    [colors, isDark],
  );

  function selectQuerySuggestion(item: SearchSuggestion) {
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

  function selectLocationSuggestion(item: LocationSuggestion) {
    setLocationFocused(false);
    setLocationSuggestions([]);
    Keyboard.dismiss();
    onLocationChange(item.name);
    onSearch?.();
  }

  const showQuerySuggestions =
    queryFocused && (loadingQuerySuggestions || querySuggestions.length > 0 || query.trim().length < 2);
  const showLocationSuggestions =
    locationFocused &&
    location.trim().length >= 2 &&
    (loadingLocationSuggestions || locationSuggestions.length > 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.gradient}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.eyebrow}>Job search</Text>
            <Text style={styles.title}>Find your next role</Text>
            <Text style={styles.subtitle}>Discover openings from top companies across India</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="briefcase" size={14} color={colors.blue} />
            <Text style={styles.statText}>{jobCount > 0 ? `${jobCount}+` : '—'}</Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.fieldWrap}>
            <View style={[styles.field, queryFocused && styles.fieldFocused]}>
              <Ionicons name="search" size={18} color={colors.blue} />
              <TextInput
                value={query}
                onChangeText={onQueryChange}
                placeholder="Role, company, or keyword"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onFocus={() => setQueryFocused(true)}
                onBlur={() => setTimeout(() => setQueryFocused(false), 250)}
                onSubmitEditing={onSearch}
              />
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

          <View style={styles.fieldWrap}>
            <View style={[styles.field, locationFocused && styles.fieldFocused]}>
              <Ionicons name="location-outline" size={18} color={colors.blue} />
              <TextInput
                value={location}
                onChangeText={onLocationChange}
                placeholder="City or location"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="search"
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setTimeout(() => setLocationFocused(false), 250)}
                onSubmitEditing={onSearch}
              />
            </View>
            <SuggestionsList
              visible={showLocationSuggestions}
              loading={loadingLocationSuggestions}
              items={locationSuggestions}
              onSelect={selectLocationSuggestion}
              emptyMessage="No locations found"
              renderItem={(item) => ({
                title: item.name,
                subtitle: item.state,
                icon: 'location-outline',
              })}
            />
          </View>

          <SelectField
            label="Experience level"
            value={experience}
            options={EXPERIENCE_FILTER_OPTIONS}
            onChange={onExperienceChange}
            placeholder="Any experience"
          />
          <Pressable onPress={onSearch} style={styles.searchBtn}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.searchBtnText}>Search jobs</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
