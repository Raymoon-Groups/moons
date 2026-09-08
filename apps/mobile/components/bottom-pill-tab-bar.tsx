import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { UserRole } from '@moons/shared';
import { router, usePathname, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useNavIndicators } from '@/lib/nav-indicators';
import { useTheme } from '@/lib/theme-context';

type PillItem = {
  routeName: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  showDot?: boolean;
};

const ITEM_COUNT = 5;
/** Active tab gets more width; the rest share what’s left. */
const ACTIVE_SHARE = 0.38;
const INACTIVE_SHARE = (1 - ACTIVE_SHARE) / (ITEM_COUNT - 1);
const TIMING = { duration: 280, easing: Easing.bezier(0.22, 1, 0.36, 1) };

function getPillItems(isRecruiter: boolean, showNetworkDot: boolean, showMessagesDot: boolean): PillItem[] {
  if (isRecruiter) {
    return [
      { routeName: 'index', label: 'Feed', icon: 'home-outline', activeIcon: 'home' },
      { routeName: 'my-jobs', label: 'Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
      {
        routeName: 'network',
        label: 'Network',
        icon: 'people-outline',
        activeIcon: 'people',
        showDot: showNetworkDot,
      },
      {
        routeName: 'messages',
        label: 'Inbox',
        icon: 'chatbubble-outline',
        activeIcon: 'chatbubble',
        showDot: showMessagesDot,
      },
      {
        routeName: 'candidates',
        label: 'Talent',
        icon: 'person-add-outline',
        activeIcon: 'person-add',
      },
    ];
  }
  return [
    { routeName: 'index', label: 'Feed', icon: 'home-outline', activeIcon: 'home' },
    { routeName: 'jobs', label: 'Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    {
      routeName: 'network',
      label: 'Network',
      icon: 'people-outline',
      activeIcon: 'people',
      showDot: showNetworkDot,
    },
    {
      routeName: 'messages',
      label: 'Inbox',
      icon: 'chatbubble-outline',
      activeIcon: 'chatbubble',
      showDot: showMessagesDot,
    },
    {
      routeName: 'companies',
      label: 'Companies',
      icon: 'business-outline',
      activeIcon: 'business',
    },
  ];
}

function routeHref(routeName: string) {
  switch (routeName) {
    case 'jobs':
      return '/(tabs)/jobs';
    case 'my-jobs':
      return '/(tabs)/my-jobs';
    case 'network':
      return '/(tabs)/network';
    case 'messages':
      return '/(tabs)/messages';
    case 'companies':
      return '/(tabs)/companies';
    case 'candidates':
      return '/(tabs)/candidates';
    case 'profile':
      return '/(tabs)/profile';
    case 'applications':
      return '/(tabs)/applications';
    default:
      return '/(tabs)';
  }
}

function resolveActiveRoute(pathname: string, segments: string[], isRecruiter: boolean): string | undefined {
  const path = pathname.toLowerCase();
  const joined = segments.join('/');

  if (path.includes('/profile') || joined.includes('profile') || path.includes('/settings')) {
    return undefined;
  }
  if (path.includes('/job') || joined.includes('jobs') || joined.includes('my-jobs') || joined.includes('applications')) {
    return isRecruiter ? 'my-jobs' : 'jobs';
  }
  if (path.includes('/network') || joined.includes('network')) return 'network';
  if (path.includes('/message') || joined.includes('messages')) return 'messages';
  if (path.includes('/companies') || joined.includes('companies')) return 'companies';
  if (path.includes('/recruiter/candidates') || joined.includes('candidates')) return 'candidates';
  if (path.includes('/recruiter') || joined.includes('recruiter')) return 'my-jobs';
  if (joined.includes('(tabs)') && (segments[1] === 'index' || !segments[1])) return 'index';
  if (joined.endsWith('(tabs)') || path.endsWith('/') || path.includes('/(tabs)')) return 'index';
  return 'index';
}

function TabPillItem({
  item,
  active,
  targetWidth,
  activeChipBg,
  inactiveIcon,
  activeIconColor,
  activeLabelColor,
  barBg,
  blue,
  onPress,
}: {
  item: PillItem;
  active: boolean;
  targetWidth: number;
  activeChipBg: string;
  inactiveIcon: string;
  activeIconColor: string;
  activeLabelColor: string;
  barBg: string;
  blue: string;
  onPress: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);
  const widthSv = useSharedValue(Math.max(targetWidth, 1));

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, TIMING);
  }, [active, progress]);

  useEffect(() => {
    if (targetWidth <= 0) return;
    widthSv.value = withTiming(targetWidth, TIMING);
  }, [targetWidth, widthSv]);

  const wrapStyle = useAnimatedStyle(() => ({
    width: widthSv.value,
  }));

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: activeChipBg,
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.85, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.88, 1]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [0, 0, 1]),
    maxWidth: interpolate(progress.value, [0, 1], [0, 86]),
    marginLeft: interpolate(progress.value, [0, 1], [0, 7]),
  }));

  return (
    <Animated.View style={[styles.itemWrap, wrapStyle]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.88 }]}
        hitSlop={6}
      >
        <View style={styles.chipHost}>
          <Animated.View pointerEvents="none" style={[styles.chipBg, chipStyle]} />
          <View style={styles.chipContent}>
            <View style={styles.iconBox}>
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={22}
                color={active ? activeIconColor : inactiveIcon}
              />
              {item.showDot ? (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active ? '#fff' : blue,
                      borderColor: active ? activeChipBg : barBg,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Animated.View style={[styles.labelClip, labelStyle]}>
              <Text style={[styles.activeLabel, { color: activeLabelColor }]} numberOfLines={1}>
                {item.label}
              </Text>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PillNavigation({
  activeRoute,
  onNavigate,
}: {
  activeRoute?: string;
  onNavigate: (routeName: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { indicators, showNetworkDot, acknowledgeNetworkBadge } = useNavIndicators();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const items = getPillItems(isRecruiter, showNetworkDot, indicators.messages);
  const [rowWidth, setRowWidth] = useState(0);

  const barBg = isDark ? colors.surfaceElevated : '#ffffff';
  const activeChipBg = isDark ? colors.surfaceHover : colors.blue;
  const inactiveIcon = isDark ? colors.silver : colors.muted;
  const activeIconColor = '#fff';
  const activeLabelColor = '#fff';
  const hasActive = items.some((item) => item.routeName === activeRoute);
  const activeW = rowWidth > 0 ? rowWidth * (hasActive ? ACTIVE_SHARE : 1 / ITEM_COUNT) : 0;
  const inactiveW = rowWidth > 0 ? rowWidth * (hasActive ? INACTIVE_SHARE : 1 / ITEM_COUNT) : 0;

  function onRowLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - rowWidth) > 0.5) setRowWidth(w);
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: barBg,
            shadowColor: colors.navy,
            borderColor: isDark ? colors.border : 'rgba(20, 35, 63, 0.08)',
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.row} onLayout={onRowLayout}>
          {items.map((item) => {
            const active = activeRoute === item.routeName;
            return (
              <TabPillItem
                key={item.routeName}
                item={item}
                active={active}
                targetWidth={active ? activeW : inactiveW}
                activeChipBg={activeChipBg}
                inactiveIcon={inactiveIcon}
                activeIconColor={activeIconColor}
                activeLabelColor={activeLabelColor}
                barBg={barBg}
                blue={colors.blue}
                onPress={() => {
                  if (item.routeName === 'network') {
                    void acknowledgeNetworkBadge(indicators.networkPendingCount);
                  }
                  onNavigate(item.routeName);
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Kept for Tabs compatibility — unused once global nav is enabled. */
export function BottomPillTabBar({ state, navigation }: BottomTabBarProps) {
  const activeRoute = state.routes[state.index]?.name;
  return (
    <PillNavigation
      activeRoute={activeRoute}
      onNavigate={(routeName) => navigation.navigate(routeName)}
    />
  );
}

const AUTH_OR_GATE_SEGMENTS = new Set([
  'login',
  'register',
  'forgot-password',
  'onboarding',
]);

export function PersistentBottomPillNav() {
  const segments = useSegments();
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const routeSegments = segments as unknown as string[];
  const first = routeSegments[0];

  if (!ready || !user) return null;
  if (!first || AUTH_OR_GATE_SEGMENTS.has(first)) return null;
  if (first === 'index' && (pathname === '/' || pathname === '')) return null;
  if (first === 'messages' && routeSegments.length > 1) return null;
  if (first === 'search') return null;

  const isRecruiter = user.role === UserRole.RECRUITER;
  const activeRoute = resolveActiveRoute(pathname, routeSegments, isRecruiter);

  return (
    <PillNavigation
      activeRoute={activeRoute}
      onNavigate={(routeName) => router.replace(routeHref(routeName) as never)}
    />
  );
}

/** Approximate height of the floating pill bar (for screen bottom padding). */
export const BOTTOM_PILL_TAB_BAR_HEIGHT = 78;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  pill: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 8,
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  itemWrap: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipHost: {
    height: 42,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  chipBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    paddingHorizontal: 10,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelClip: {
    overflow: 'hidden',
  },
  activeLabel: {
    fontSize: 13,
    lineHeight: 16,
    ...fontStyle('semibold'),
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
});
