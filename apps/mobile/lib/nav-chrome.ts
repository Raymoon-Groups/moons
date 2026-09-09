import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { makeMutable, withTiming } from 'react-native-reanimated';

/** 0 = navbars visible, 1 = fully hidden */
export const navChromeHideProgress = makeMutable(0);

const HIDE_MS = 220;
const SHOW_MS = 200;
const HIDE_DY = 8;
const SHOW_DY = 8;
const TOP_REVEAL_Y = 28;

let lastOffsetY = 0;

export function showNavChrome() {
  navChromeHideProgress.value = withTiming(0, { duration: SHOW_MS });
}

export function hideNavChrome() {
  navChromeHideProgress.value = withTiming(1, { duration: HIDE_MS });
}

/** Call from any ScrollView / FlatList `onScroll`. */
export function reportNavScroll(offsetY: number) {
  const y = Math.max(0, offsetY);
  const dy = y - lastOffsetY;

  // Ignore tiny jitter so scroll-down hide isn't immediately undone.
  if (Math.abs(dy) < 1.5) {
    lastOffsetY = y;
    return;
  }

  if (y <= TOP_REVEAL_Y) {
    if (navChromeHideProgress.value > 0.01) showNavChrome();
    lastOffsetY = y;
    return;
  }

  if (dy > HIDE_DY) {
    hideNavChrome();
  } else if (dy < -SHOW_DY) {
    showNavChrome();
  }

  lastOffsetY = y;
}

export function useNavChromeScrollProps() {
  return {
    scrollEventThrottle: 16 as const,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      reportNavScroll(e.nativeEvent.contentOffset.y);
    },
  };
}

/** Reset bars when the route changes. */
export function useResetNavChromeOnNavigate() {
  const pathname = usePathname();
  useEffect(() => {
    lastOffsetY = 0;
    showNavChrome();
  }, [pathname]);
}
