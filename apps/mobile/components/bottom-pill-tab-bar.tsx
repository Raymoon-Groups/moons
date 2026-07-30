import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { UserRole } from '@moons/shared';
import { router, usePathname, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { useNavIndicators } from '@/lib/nav-indicators';
import { useTheme } from '@/lib/theme-context';
import { fontStyle } from '@/lib/font-style';

type PillItem = {
  routeName: string;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  showDot?: boolean;
};

function getPillItems(isRecruiter: boolean, showNetworkDot: boolean, showMessagesDot: boolean): PillItem[] {
  if (isRecruiter) {
    return [
      { routeName: 'index', label: 'Feed', shortLabel: 'Feed', icon: 'home-outline', activeIcon: 'home' },
      { routeName: 'my-jobs', label: 'Jobs', shortLabel: 'Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
      {
        routeName: 'network',
        label: 'Network',
        shortLabel: 'Network',
        icon: 'people-outline',
        activeIcon: 'people',
        showDot: showNetworkDot,
      },
      {
        routeName: 'messages',
        label: 'Messages',
        shortLabel: 'Messages',
        icon: 'chatbubble-outline',
        activeIcon: 'chatbubble',
        showDot: showMessagesDot,
      },
      {
        routeName: 'candidates',
        label: 'Candidates',
        shortLabel: 'Candidates',
        icon: 'person-add-outline',
        activeIcon: 'person-add',
      },
    ];
  }
  return [
    { routeName: 'index', label: 'Feed', shortLabel: 'Feed', icon: 'home-outline', activeIcon: 'home' },
    { routeName: 'jobs', label: 'Jobs', shortLabel: 'Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    {
      routeName: 'network',
      label: 'Network',
      shortLabel: 'Network',
      icon: 'people-outline',
      activeIcon: 'people',
      showDot: showNetworkDot,
    },
    {
      routeName: 'messages',
      label: 'Messages',
      shortLabel: 'Messages',
      icon: 'chatbubble-outline',
      activeIcon: 'chatbubble',
      showDot: showMessagesDot,
    },
    {
      routeName: 'companies',
      label: 'Companies',
      shortLabel: 'Companies',
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

  if (path.includes('/job') || joined.includes('jobs') || joined.includes('my-jobs') || joined.includes('applications')) {
    return isRecruiter ? 'my-jobs' : 'jobs';
  }
  if (path.includes('/network') || joined.includes('network')) return 'network';
  if (path.includes('/message') || joined.includes('messages')) return 'messages';
  if (path.includes('/companies') || joined.includes('companies')) return 'companies';
  if (path.includes('/recruiter/candidates') || joined.includes('candidates')) return 'candidates';
  if (path.includes('/recruiter') || joined.includes('recruiter')) return 'my-jobs';
  if (path.includes('/profile') || joined.includes('profile') || path.includes('/settings')) {
    return 'index';
  }
  if (joined.includes('(tabs)') && (segments[1] === 'index' || !segments[1])) return 'index';
  if (joined.endsWith('(tabs)') || path.endsWith('/') || path.includes('/(tabs)')) return 'index';
  return 'index';
}

function PillNavigation({
  activeRoute,
  onNavigate,
}: {
  activeRoute?: string;
  onNavigate: (routeName: string) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { indicators, showNetworkDot, acknowledgeNetworkBadge } = useNavIndicators();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const items = getPillItems(isRecruiter, showNetworkDot, indicators.messages);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(15, 23, 38, 0.10)',
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
                  onNavigate(item.routeName);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.item,
                  active && { backgroundColor: `${colors.blue}1f` },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={21}
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
                    { color: active ? colors.blue : colors.muted },
                    active ? fontStyle('bold') : fontStyle('medium'),
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

/**
 * Single bottom navigation for every authenticated screen
 * (Feed, Jobs, Network, Messages, Companies, and nested pages).
 */
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
  // Hide on auth / gate routes only — show on Feed, Jobs, Network, Messages, and every nested page.
  if (!first || AUTH_OR_GATE_SEGMENTS.has(first)) return null;
  if (first === 'index' && (pathname === '/' || pathname === '')) return null;

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
export const BOTTOM_PILL_TAB_BAR_HEIGHT = 76;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  pill: {
    width: '100%',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 5,
    overflow: 'hidden',
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
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 9,
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
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
});
