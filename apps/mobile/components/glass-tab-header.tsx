import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname, useSegments } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserRole } from '@moons/shared';
import { NotificationBell } from '@/components/notification-bell';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import {
  navChromeHideProgress,
  useResetNavChromeOnNavigate,
} from '@/lib/nav-chrome';
import { useNavIndicators } from '@/lib/nav-indicators';
import { useTheme } from '@/lib/theme-context';

/** Approx. bar row height (excluding safe area). Used for list top padding. */
export const GLASS_TAB_HEADER_BAR_HEIGHT = 52;

function resolveTitle(pathname: string, segments: string[], isRecruiter: boolean): string {
  const path = pathname.toLowerCase();
  const joined = segments.join('/').toLowerCase();

  if (path.includes('/profile') || joined.includes('profile') || path.includes('/settings')) {
    return 'Profile';
  }
  if (path.includes('/message') || joined.includes('messages')) return 'Messaging';
  if (path.includes('/network') || joined.includes('network')) return 'My Network';
  if (path.includes('/companies') || joined.includes('companies')) return 'Companies';
  if (path.includes('/recruiter/candidates') || joined.includes('candidates')) {
    return 'Candidates';
  }
  if (joined.includes('applications')) return 'Applied';
  if (joined.includes('my-jobs') || (isRecruiter && (path.includes('/job') || joined.includes('jobs')))) {
    return 'My jobs';
  }
  if (path.includes('/job') || joined.includes('jobs')) {
    return 'Jobs';
  }
  if (joined.includes('(tabs)') || path.includes('/(tabs)') || path.endsWith('/')) {
    return 'Feed';
  }
  return 'MoonsJob';
}

/**
 * Full-width top app bar. Rendered as an absolute overlay (not React Navigation header)
 * so hide-on-scroll translateY works reliably.
 */
export function PersistentGlassTabHeader() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, ready } = useAuth();
  const { indicators } = useNavIndicators();
  const pathname = usePathname();
  const segments = useSegments() as unknown as string[];
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const iconSize = compact ? 18 : 20;
  const btnSize = compact ? 34 : 38;
  const avatarSize = compact ? 30 : 34;
  const measuredHeight = useSharedValue(insets.top + GLASS_TAB_HEADER_BAR_HEIGHT);
  const [chromeInteractive, setChromeInteractive] = useState(true);

  useResetNavChromeOnNavigate();

  useAnimatedReaction(
    () => navChromeHideProgress.value > 0.55,
    (hidden, prev) => {
      if (hidden !== prev) {
        runOnJS(setChromeInteractive)(!hidden);
      }
    },
  );

  const first = segments[0];
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const showOnTabs = Boolean(ready && user && first === '(tabs)');

  const title = useMemo(
    () => resolveTitle(pathname, segments, Boolean(isRecruiter)),
    [pathname, segments, isRecruiter],
  );

  const profileActive =
    pathname.toLowerCase().includes('/profile') ||
    segments.includes('profile') ||
    pathname.toLowerCase().includes('/settings');

  const name = user?.fullName?.trim() || user?.email || 'Me';
  const avatarUri = resolveAvatarUrl(user?.avatarUrl, user?.avatarVersion);

  const chromeStyle = useAnimatedStyle(() => {
    const h = Math.max(measuredHeight.value, 1);
    const t = navChromeHideProgress.value;
    return {
      transform: [{ translateY: -h * t }],
    };
  });

  if (!showOnTabs) return null;

  return (
    <Animated.View
      pointerEvents={chromeInteractive ? 'box-none' : 'none'}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0) measuredHeight.value = h;
      }}
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, 8),
          backgroundColor: isDark ? 'rgba(28, 35, 48, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          borderBottomColor: colors.border,
        },
        chromeStyle,
      ]}
    >
      <View style={styles.bar} pointerEvents="auto">
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.heading }, fontStyle('semibold')]}
        >
          {title}
        </Text>

        <View style={[styles.actions, compact && styles.actionsCompact]}>
          <Pressable
            onPress={() => router.push('/search' as never)}
            style={[styles.iconBtn, { width: btnSize, height: btnSize, borderRadius: btnSize / 2 }]}
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={iconSize} color={colors.heading} />
          </Pressable>
          <NotificationBell hasUnread={indicators.bell} compact={compact} bare />
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={[
              styles.profileBtn,
              {
                width: avatarSize + 4,
                height: avatarSize + 4,
                borderRadius: (avatarSize + 4) / 2,
                borderColor: profileActive ? colors.blue : 'transparent',
                backgroundColor: profileActive ? `${colors.blue}18` : 'transparent',
              },
            ]}
            accessibilityLabel="Profile"
            accessibilityState={{ selected: profileActive }}
          >
            <View
              style={[
                styles.avatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  backgroundColor: isDark ? colors.surface : `${colors.blue}14`,
                  borderColor: profileActive
                    ? colors.blue
                    : isDark
                      ? colors.border
                      : 'rgba(15,28,51,0.08)',
                },
              ]}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[{ color: colors.blue, fontSize: avatarSize * 0.38 }, fontStyle('bold')]}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

/** @deprecated Use PersistentGlassTabHeader — kept so old imports don't break mid-refactor. */
export function GlassTabHeader({ title }: { title: string }) {
  return <PersistentGlassTabHeader />;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minHeight: GLASS_TAB_HEADER_BAR_HEIGHT,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 6,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  actionsCompact: {
    gap: 0,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginLeft: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
