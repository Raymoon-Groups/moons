import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type ProfileContentTab = 'personal' | 'general' | 'background';

export type ProfileContentTabItem = { id: ProfileContentTab; label: string };

const DEFAULT_TABS: ProfileContentTabItem[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'general', label: 'General' },
  { id: 'background', label: 'Background' },
];

/** Used on other members’ profiles (Feed / About / Background). */
export const PUBLIC_PROFILE_TABS: ProfileContentTabItem[] = [
  { id: 'general', label: 'Feed' },
  { id: 'personal', label: 'About' },
  { id: 'background', label: 'Background' },
];

export function ProfileContentTabs({
  value,
  onChange,
  tabs = DEFAULT_TABS,
}: {
  value: ProfileContentTab;
  onChange: (tab: ProfileContentTab) => void;
  tabs?: ProfileContentTabItem[];
}) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? colors.surface : '#EEF2F7',
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.tab,
              active && {
                backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                ...theme.shadow.soft,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                active
                  ? { color: colors.blue, ...fontStyle('bold') }
                  : { color: colors.muted, ...fontStyle('semibold') },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginBottom: 18,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 11,
  },
  label: {
    fontSize: 13,
  },
});
