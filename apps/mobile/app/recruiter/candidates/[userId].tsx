import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { CandidateProfileReadonly } from '@/components/profile/candidate-profile-readonly';
import { LoadingScreen } from '@/components/loading-screen';
import { authFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export default function CandidateProfileScreen() {
  const { colors } = useTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    authFetch<Profile>(`/profiles/candidates/${userId}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <AppScreen style={styles.center}>
        <Text style={{ color: colors.muted, ...fontStyle('regular') }}>Candidate not found.</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <CandidateProfileReadonly profile={profile} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: theme.spacing.md, paddingBottom: 32 },
});
