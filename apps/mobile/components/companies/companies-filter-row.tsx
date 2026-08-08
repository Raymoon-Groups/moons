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
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { CompanySortKey } from '@/lib/companies-filters';

export type CompaniesFilterSheet = 'location' | 'category' | 'sort';

type ActiveSheet = CompaniesFilterSheet | null;

/** Space above the keyboard so CTAs (and IME suggestion bars) stay fully visible. */
function keyboardLift(height: number, bottomInset: number) {
  if (height <= 0) return 0;
  // On many Androids, reported keyboard height slightly undershoots (nav bar / suggestions).
  const cushion = Platform.OS === 'android' ? 36 : 16;
  return height + bottomInset + cushion;
}

export function CompaniesFilterRow({
  location,
  category,
  sort,
  categoryOptions,
  sortOptions,
  onLocationChange,
  onCategoryChange,
  onSortChange,
}: {
  location: string;
  category: string;
  sort: CompanySortKey;
  categoryOptions: { label: string; value: string }[];
  sortOptions: { label: string; value: CompanySortKey }[];
  onLocationChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSortChange: (v: CompanySortKey) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<ActiveSheet>(null);
  const [locationDraft, setLocationDraft] = useState(location);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const categoryLabel =
    category === 'all'
      ? 'Category'
      : categoryOptions.find((o) => o.value === category)?.label || 'Category';
  const sortLabel =
    sort === 'jobs' ? 'Most jobs' : sortOptions.find((o) => o.value === sort)?.label || 'Sort';
  const locationLabel = location.trim() || 'Location';

  const chips: { key: ActiveSheet; label: string; active: boolean }[] = [
    { key: 'location', label: locationLabel, active: Boolean(location.trim()) },
    { key: 'category', label: categoryLabel, active: category !== 'all' },
    { key: 'sort', label: sortLabel, active: sort !== 'jobs' },
  ];

  const lift = keyboardLift(keyboardHeight, insets.bottom);
  const sheetBottomPad =
    keyboardHeight > 0 ? theme.spacing.md : Math.max(insets.bottom, 16) + theme.spacing.sm;

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
        locationBody: {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
        },
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
      case 'category':
        return 'Company category';
      case 'sort':
        return 'Sort companies';
      default:
        return '';
    }
  }

  function applyLocation() {
    onLocationChange(locationDraft.trim());
    close();
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map((chip) => (
          <Pressable key={chip.key} onPress={() => setSheet(chip.key)} style={styles.chip}>
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
                    blurOnSubmit
                    onSubmitEditing={applyLocation}
                  />
                </View>
                <Pressable style={styles.applyBtn} onPress={applyLocation}>
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
                data={
                  sheet === 'category'
                    ? categoryOptions
                    : sortOptions.map((o) => ({ label: o.label, value: o.value }))
                }
                keyExtractor={(item) => item.value}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => {
                  const active =
                    sheet === 'category' ? item.value === category : item.value === sort;
                  return (
                    <Pressable
                      style={styles.option}
                      onPress={() => {
                        if (sheet === 'category') onCategoryChange(item.value);
                        else onSortChange(item.value as CompanySortKey);
                        close();
                      }}
                    >
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
