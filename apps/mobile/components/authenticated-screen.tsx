import { View } from 'react-native';
import { BOTTOM_PILL_TAB_BAR_HEIGHT } from '@/components/bottom-pill-tab-bar';
import { ConnectionInvitesBanner } from '@/components/connection-invites-banner';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';

export function AuthenticatedScreen({
  children,
  /** Set false when the screen's own scroll content already reserves room for the bottom nav. */
  padBottom = true,
}: {
  children: React.ReactNode;
  padBottom?: boolean;
}) {
  const paddingBottom = useTabScreenPadding();

  return (
    <View style={{ flex: 1 }}>
      <ConnectionInvitesBanner />
      <View style={{ flex: 1, paddingBottom: padBottom ? paddingBottom : 0 }}>{children}</View>
    </View>
  );
}

export { BOTTOM_PILL_TAB_BAR_HEIGHT };
