import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SuggestionsList } from '@/components/jobs/suggestions-list';
import {
  fetchLocationSuggestions,
  type LocationSuggestion,
} from '@/lib/location-suggestions';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type JobsFilterChipOption = { label: string; value: string };

export type JobsFilterSheet = 'location' | 'jobType' | 'experience' | 'sort';

type ActiveSheet = JobsFilterSheet | null;

export function JobsFilterRow({
  location,
  jobType,
  experience,
  sort,
  jobTypeOptions,
  experienceOptions,
  sortOptions,
  onLocationChange,
  onJobTypeChange,
  onExperienceChange,
  onSortChange,
  openSheet,
  onOpenSheetHandled,
}: {
  location: string;
  jobType: string;
  experience: string;
  sort: string;
  jobTypeOptions: JobsFilterChipOption[];
  experienceOptions: JobsFilterChipOption[];
  sortOptions: JobsFilterChipOption[];
  onLocationChange: (v: string) => void;
  onJobTypeChange: (v: string) => void;
  onExperienceChange: (v: string) => void;
  onSortChange: (v: string) => void;
  openSheet?: JobsFilterSheet | null;
  onOpenSheetHandled?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<ActiveSheet>(null);
  const [locationDraft, setLocationDraft] = useState(location);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!openSheet) return;
    setSheet(openSheet);
    onOpenSheetHandled?.();
  }, [openSheet, onOpenSheetHandled]);

  useEffect(() => {
    if (sheet === 'location') setLocationDraft(location);
  }, [sheet, location]);

  useEffect(() => {
    if (sheet == null) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [sheet]);

  useEffect(() => {
    if (sheet !== 'location') return;
    const trimmed = locationDraft.trim();
    if (trimmed.length < 2) {
      setLocationSuggestions([]);
      setLoadingLocations(false);
      return;
    }
    setLoadingLocations(true);
    const timer = setTimeout(() => {
      void fetchLocationSuggestions(trimmed)
        .then(setLocationSuggestions)
        .catch(() => setLocationSuggestions([]))
        .finally(() => setLoadingLocations(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [locationDraft, sheet]);

  const lift =
    keyboardHeight > 0
      ? keyboardHeight + insets.bottom + (Platform.OS === 'android' ? 36 : 16)
      : 0;
  const sheetBottomPad =
    keyboardHeight > 0 ? theme.spacing.md : Math.max(insets.bottom, 16) + theme.spacing.sm;

  const jobTypeLabel =
    jobTypeOptions.find((o) => o.value === jobType)?.label?.replace(/^All\b.*/i, 'Job type') ||
    'Job type';
  const experienceLabel =
    experienceOptions.find((o) => o.value === experience)?.label || 'Experience';
  const sortLabel = sortOptions.find((o) => o.value === sort)?.label || 'By date';
  const locationLabel = location.trim() || 'Location';

  const chips: { key: ActiveSheet; label: string; active: boolean }[] = [
    { key: 'location', label: locationLabel, active: Boolean(location.trim()) },
    {
      key: 'jobType',
      label: jobType === 'all' ? 'Job type' : jobTypeLabel,
      active: jobType !== 'all',
    },
    {
      key: 'experience',
      label: experience ? experienceLabel.split('(')[0].trim() : 'Experience',
      active: Boolean(experience),
    },
    {
      key: 'sort',
      label: sort === 'newest' ? 'By date' : sortLabel,
      active: sort !== 'newest',
    },
  ];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { marginBottom: theme.spacing.sm },
        row: { flexDirection: 'row', gap: 8, paddingRight: 4 },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderRadius: theme.radius.full,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: colors.blue,
          maxWidth: 160,
        },
        chipText: {
          fontSize: 13,
          color: '#fff',
          ...fontStyle('semibold'),
        },
        root: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.45)',
        },
        sheet: {
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: theme.radius.lg,
          borderTopRightRadius: theme.radius.lg,
          maxHeight: '78%',
          overflow: 'hidden',
        },
        sheetHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        sheetTitle: { fontSize: 16, color: colors.heading, ...fontStyle('bold') },
        option: {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        optionText: { fontSize: 15, color: colors.foreground, ...fontStyle('medium') },
        optionActive: { color: colors.blue, ...fontStyle('bold') },
        locationBody: { padding: theme.spacing.md },
        locationField: {
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
        locationInput: {
          flex: 1,
          fontSize: 15,
          color: colors.foreground,
          padding: 0,
          ...fontStyle('regular'),
        },
        applyBtn: {
          marginTop: 14,
          backgroundColor: colors.blue,
          borderRadius: theme.radius.md,
          paddingVertical: 13,
          alignItems: 'center',
        },
        applyText: { color: '#fff', fontSize: 15, ...fontStyle('bold') },
        clearBtn: {
          marginTop: 10,
          alignItems: 'center',
          paddingVertical: 8,
        },
        clearText: { color: colors.muted, fontSize: 14, ...fontStyle('semibold') },
      }),
    [colors],
  );

  function close() {
    setSheet(null);
    Keyboard.dismiss();
  }

  function sheetTitle() {
    switch (sheet) {
      case 'location':
        return 'Location';
      case 'jobType':
        return 'Job type';
      case 'experience':
        return 'Experience';
      case 'sort':
        return 'Sort by date';
      default:
        return '';
    }
  }

  const listOptions =
    sheet === 'jobType'
      ? jobTypeOptions
      : sheet === 'experience'
        ? experienceOptions
        : sheet === 'sort'
          ? sortOptions
          : [];

  const selectedValue =
    sheet === 'jobType' ? jobType : sheet === 'experience' ? experience : sheet === 'sort' ? sort : '';

  function selectOption(value: string) {
    if (sheet === 'jobType') onJobTypeChange(value);
    if (sheet === 'experience') onExperienceChange(value);
    if (sheet === 'sort') onSortChange(value);
    close();
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setSheet(chip.key)}
            style={[styles.chip, chip.active && { opacity: 1 }]}
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {chip.label}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={sheet != null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={[styles.root, { paddingBottom: lift }]}>
          <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close filters" />

          <View style={[styles.sheet, { paddingBottom: sheetBottomPad }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{sheetTitle()}</Text>
              <Pressable onPress={close} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            {sheet === 'location' ? (
              <View style={styles.locationBody}>
                <View style={styles.locationField}>
                  <Ionicons name="location-outline" size={18} color={colors.blue} />
                  <TextInput
                    value={locationDraft}
                    onChangeText={setLocationDraft}
                    placeholder="City or location"
                    placeholderTextColor={colors.muted}
                    style={styles.locationInput}
                    autoCapitalize="words"
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      onLocationChange(locationDraft.trim());
                      close();
                    }}
                  />
                </View>
                <SuggestionsList
                  visible={locationDraft.trim().length >= 2}
                  loading={loadingLocations}
                  items={locationSuggestions}
                  onSelect={(item) => {
                    onLocationChange(item.name);
                    close();
                  }}
                  emptyMessage="No locations found"
                  renderItem={(item) => ({
                    title: item.name,
                    subtitle: item.state,
                    icon: 'location-outline',
                  })}
                />
                <Pressable
                  style={styles.applyBtn}
                  onPress={() => {
                    onLocationChange(locationDraft.trim());
                    close();
                  }}
                >
                  <Text style={styles.applyText}>Apply location</Text>
                </Pressable>
                {location.trim() ? (
                  <Pressable
                    style={styles.clearBtn}
                    onPress={() => {
                      onLocationChange('');
                      close();
                    }}
                  >
                    <Text style={styles.clearText}>Clear location</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <FlatList
                data={listOptions}
                keyExtractor={(item) => item.value || item.label}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => {
                  const active = item.value === selectedValue;
                  return (
                    <Pressable style={styles.option} onPress={() => selectOption(item.value)}>
                      <Text style={[styles.optionText, active && styles.optionActive]}>
                        {item.label}
                      </Text>
                      {active ? <Ionicons name="checkmark" size={18} color={colors.blue} /> : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
