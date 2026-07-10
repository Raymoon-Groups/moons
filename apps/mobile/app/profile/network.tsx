import { ScrollView, StyleSheet } from 'react-native';
import { ProfileNetworkSection } from '@/components/profile/profile-network-section';
import { ScreenHeader } from '@/components/portal-ui';
import { AppScreen } from '@/components/app-screen';
import { theme } from '@/lib/theme';

export default function ProfileNetworkScreen() {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Profile"
          title="My network"
          subtitle="Manage connections, pending requests, and profile visitors."
        />
        <ProfileNetworkSection />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md, paddingBottom: 32 },
});
