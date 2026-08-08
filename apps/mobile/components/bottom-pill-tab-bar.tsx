import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRole } from '@moons/shared';
import { router, usePathname, useSegments } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { useNavIndicators } from '@/lib/nav-indicators';
import { useTheme } from '@/lib/theme-context';

type PillItem = {
  routeName: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  showDot?: boolean;
};

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
        label: 'Messages',
        icon: 'chatbubble-outline',
        activeIcon: 'chatbubble',
        showDot: showMessagesDot,
      },
      {
        routeName: 'candidates',
        label: 'Candidates',
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
      label: 'Messages',
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

  // Profile lives in the header — don't highlight any bottom pill tab.
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

  const barBg = isDark ? colors.surfaceElevated : '#F7F4F0';
  const inactiveSlot = isDark ? `${colors.border}88` : 'rgba(255,255,255,0.72)';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: barBg,
            borderColor: isDark ? colors.border : 'rgba(15, 23, 38, 0.06)',
            shadowColor: '#0f172a',
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
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.82 }]}
              >
                {active ? (
                  <LinearGradient
                    colors={[colors.blue, '#6b9ae8', colors.blueDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.activeSlot, { shadowColor: colors.blue }]}
                  >
                    <Ionicons name={item.activeIcon} size={22} color="#fff" />
                    {item.showDot ? (
                      <View style={[styles.dot, styles.dotOnActive, { borderColor: colors.blue }]} />
                    ) : null}
                  </LinearGradient>
                ) : (
                  <View style={[styles.inactiveSlot, { backgroundColor: inactiveSlot }]}>
                    <Ionicons name={item.icon} size={22} color={isDark ? colors.muted : '#1a1a1a'} />
                    {item.showDot ? (
                      <View style={[styles.dot, { backgroundColor: colors.blue, borderColor: barBg }]} />
                    ) : null}
                  </View>
                )}
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
  // Hide floating pill inside an open chat thread so the compose box stays visible.
  if (first === 'messages' && routeSegments.length > 1) return null;
  // Full-screen search should not sit under the tab pill.
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
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  activeSlot: {
    width: 56,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  inactiveSlot: {
    width: 46,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    right: 8,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  dotOnActive: {
    backgroundColor: '#fff',
  },
});
