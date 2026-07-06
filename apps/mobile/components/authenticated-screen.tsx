import { View } from 'react-native';
import { BOTTOM_PILL_TAB_BAR_HEIGHT } from '@/components/bottom-pill-tab-bar';
import { ConnectionInvitesBanner } from '@/components/connection-invites-banner';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';

export function AuthenticatedScreen({ children }: { children: React.ReactNode }) {
  const paddingBottom = useTabScreenPadding(0);

  return (
    <View style={{ flex: 1 }}>
      <ConnectionInvitesBanner />
      <View style={{ flex: 1, paddingBottom }}>{children}</View>
    </View>
  );
}

export { BOTTOM_PILL_TAB_BAR_HEIGHT };
