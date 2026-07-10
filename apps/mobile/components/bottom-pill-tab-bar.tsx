import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { UserRole } from '@moons/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { useNavIndicators } from '@/lib/nav-indicators';
import { useTheme } from '@/lib/theme-context';
import { fontStyle } from '@/lib/font-style';
import { theme } from '@/lib/theme';

type PillItem = {
  routeName: string;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  showDot?: boolean;
};

function getPillItems(isRecruiter: boolean, showNetworkDot: boolean, showMessagesDot: boolean): PillItem[] {
  if (isRecruiter) {
    return [
      { routeName: 'my-jobs', label: 'Jobs', shortLabel: 'Jobs', icon: 'briefcase-outline' },
      { routeName: 'network', label: 'Network', shortLabel: 'Network', icon: 'people-outline', showDot: showNetworkDot },
      { routeName: 'messages', label: 'Messages', shortLabel: 'Messages', icon: 'chatbubble-outline', showDot: showMessagesDot },
      { routeName: 'candidates', label: 'Candidates', shortLabel: 'Candidates', icon: 'person-add-outline' },
    ];
  }
  return [
    { routeName: 'jobs', label: 'Jobs', shortLabel: 'Jobs', icon: 'briefcase-outline' },
    { routeName: 'network', label: 'Network', shortLabel: 'Network', icon: 'people-outline', showDot: showNetworkDot },
    { routeName: 'messages', label: 'Messages', shortLabel: 'Messages', icon: 'chatbubble-outline', showDot: showMessagesDot },
    { routeName: 'companies', label: 'Companies', shortLabel: 'Companies', icon: 'business-outline' },
  ];
}

export function BottomPillTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { indicators, showNetworkDot, acknowledgeNetworkBadge } = useNavIndicators();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const items = getPillItems(isRecruiter, showNetworkDot, indicators.messages);
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            ...theme.shadow.card,
          },
        ]}
      >
        <View style={styles.row}>
          {items.map((item) => {
            const active = activeRoute === item.routeName;
            return (
              <Pressable
                key={item.routeName}
                onPress={() => {
                  if (item.routeName === 'network') {
                    void acknowledgeNetworkBadge(indicators.networkPendingCount);
                  }
                  navigation.navigate(item.routeName);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.item,
                  active && {
                    backgroundColor: `${colors.blue}1F`,
                    borderColor: `${colors.blue}2E`,
                    borderWidth: 1,
                  },
                  pressed && { opacity: 0.88 },
                ]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? colors.blue : colors.muted}
                  />
                  {item.showDot ? (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.blue, borderColor: colors.surfaceElevated },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={[
                    styles.label,
                    { color: active ? colors.blue : colors.heading },
                    active ? fontStyle('semibold') : fontStyle('medium'),
                  ]}
                >
                  {item.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Approximate height of the floating pill bar (for screen bottom padding). */
export const BOTTOM_PILL_TAB_BAR_HEIGHT = 76;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  pill: {
    width: '100%',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 999,
  },
  iconWrap: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
});
