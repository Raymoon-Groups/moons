import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { CandidateProfileReadonly } from '@/components/profile/candidate-profile-readonly';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError, authFetch } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { fetchConversationWithUser } from '@/lib/messages';
import { useTabScreenPadding } from '@/lib/tab-screen-padding';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export default function CandidateProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const bottomPadding = useTabScreenPadding(24);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profile?.fullName?.trim() || 'Candidate',
    });
  }, [navigation, profile?.fullName]);

  useEffect(() => {
    if (!userId) return;
    authFetch<Profile>(`/profiles/candidates/${userId}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  async function openMessage() {
    if (!userId) return;
    setMessaging(true);
    try {
      const conv = await fetchConversationWithUser(userId);
      router.push(`/messages/${conv.id}` as never);
    } catch (err) {
      Alert.alert(
        'Could not open chat',
        err instanceof ApiError ? err.message : 'Connect with this candidate first, or try again.',
      );
    } finally {
      setMessaging(false);
    }
  }

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
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => void openMessage()}
          disabled={messaging}
          style={[
            styles.messageBtn,
            { backgroundColor: colors.blue, opacity: messaging ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.messageBtnText, fontStyle('bold')]}>
            {messaging ? 'Opening…' : 'Message candidate'}
          </Text>
        </Pressable>
        <CandidateProfileReadonly profile={profile} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: theme.spacing.md },
  messageBtn: {
    borderRadius: theme.radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  messageBtnText: { color: '#fff', fontSize: 15 },
});
