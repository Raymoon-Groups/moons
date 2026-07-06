import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_PILL_TAB_BAR_HEIGHT } from '@/components/bottom-pill-tab-bar';
import { theme } from '@/lib/theme';

/** Bottom inset so content clears the floating pill tab bar on all phone sizes. */
export function useTabScreenPadding(extra: number = theme.spacing.md) {
  const insets = useSafeAreaInsets();
  return BOTTOM_PILL_TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + extra;
}
