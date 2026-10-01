import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
} from 'react-native';
import { reportNavScroll } from '@/lib/nav-chrome';
import { useTabScreenTopPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';

type ControlProps = Omit<
  RefreshControlProps,
  'tintColor' | 'colors' | 'progressBackgroundColor' | 'progressViewOffset'
> & {
  /** Hide the native iOS spinner when a custom TabRefreshIndicator is shown. */
  hideSystemTint?: boolean;
};

/**
 * Pull-to-refresh for tab screens under the absolute glass header.
 * Offsets the system spinner below the header so it is visible when you pull.
 */
export function TabRefreshControl({ hideSystemTint = false, ...props }: ControlProps) {
  const { colors, isDark } = useTheme();
  const topPadding = useTabScreenTopPadding(0);

  return (
    <RefreshControl
      {...props}
      tintColor={hideSystemTint && Platform.OS === 'ios' ? 'transparent' : colors.blue}
      colors={[colors.blue]}
      progressBackgroundColor={isDark ? colors.surfaceElevated : '#ffffff'}
      progressViewOffset={topPadding}
    />
  );
}

/** Renders the iOS pull indicator below the glass header. */
export function TabRefreshIndicator({
  refreshing,
  pullDistance,
}: {
  refreshing: boolean;
  pullDistance: number;
}) {
  const { colors } = useTheme();
  const topPadding = useTabScreenTopPadding(0);
  const visible = refreshing || pullDistance > 18;
  if (Platform.OS !== 'ios' || !visible) return null;

  const opacity = refreshing ? 1 : Math.min(1, pullDistance / 64);

  return (
    <View
      pointerEvents="none"
      style={[styles.iosIndicator, { top: Math.max(topPadding - 6, 8), opacity }]}
    >
      <ActivityIndicator color={colors.blue} />
    </View>
  );
}

/**
 * Scroll handlers for tab lists: nav chrome hide/show + iOS pull distance for refresh UI.
 */
export function useTabRefreshScroll(refreshing: boolean) {
  const [pullDistance, setPullDistance] = useState(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      reportNavScroll(y);
      // iOS rubber-band goes negative while pulling to refresh.
      if (!refreshing) {
        setPullDistance(y < 0 ? -y : 0);
      } else if (pullDistance !== 0) {
        setPullDistance(0);
      }
    },
    [pullDistance, refreshing],
  );

  return {
    pullDistance,
    scrollProps: {
      scrollEventThrottle: 16 as const,
      onScroll,
    },
  };
}

const styles = StyleSheet.create({
  iosIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
});
