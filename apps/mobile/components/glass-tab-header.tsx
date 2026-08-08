import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { resolveAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/lib/auth-context';
import { fontStyle } from '@/lib/font-style';
import { useNavIndicators } from '@/lib/nav-indicators';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function GlassTabHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { indicators } = useNavIndicators();
  const pathname = usePathname();
  const segments = useSegments() as unknown as string[];
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const iconSize = compact ? 18 : 20;
  const btnSize = compact ? 34 : 38;
  const avatarSize = compact ? 30 : 34;

  const profileActive =
    pathname.toLowerCase().includes('/profile') ||
    segments.includes('profile') ||
    pathname.toLowerCase().includes('/settings');

  const name = user?.fullName?.trim() || user?.email || 'Me';
  const avatarUri = resolveAvatarUrl(user?.avatarUrl, user?.avatarVersion);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, 8),
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark ? 'rgba(28, 35, 48, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: colors.border,
          },
          theme.shadow.soft,
        ]}
      >
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
          <ThemeToggle size={btnSize} bare />
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
                  borderColor: profileActive ? colors.blue : isDark ? colors.border : 'rgba(15,28,51,0.08)',
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
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
