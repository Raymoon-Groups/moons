import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScreen } from '@/components/app-screen';
import { ConnectInviteModal } from '@/components/network/connect-invite-modal';
import { resolveAvatarUrl } from '@/lib/assets';
import {
  acceptConnection,
  cancelConnection,
  fetchNetworkProfile,
  rejectConnection,
  removeConnection,
  type NetworkProfileResponse,
} from '@/lib/network';
import {
  isStaleConnectionInviteError,
  notifyConnectionsRefresh,
} from '@/lib/connection-invites';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export default function NetworkProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useTheme();
  const [data, setData] = useState<NetworkProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setData(await fetchNetworkProfile(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile unavailable');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: () => Promise<unknown>) {
    setActionLoading(true);
    setError('');
    try {
      await action();
      notifyConnectionsRefresh();
      await load();
    } catch (err) {
      if (!isStaleConnectionInviteError(err)) {
        setError(err instanceof Error ? err.message : 'Action failed');
      } else {
        await load();
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.blue} size="large" />
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>{error || 'Profile not found'}</Text>
        </View>
      </AppScreen>
    );
  }

  const profile = data.profile;
  const name = profile.fullName?.trim() || 'Professional';
  const avatar = resolveAvatarUrl(profile.avatarUrl as string | null);
  const skills = (profile.skills as string[] | undefined) ?? [];

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.banner, { backgroundColor: `${colors.blue}33` }]} />
        <View style={styles.header}>
          <View style={[styles.avatar, { borderColor: colors.surfaceElevated, backgroundColor: colors.surface }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={[fontStyle('bold'), { fontSize: 28, color: colors.heading }]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.name, { color: colors.heading }, fontStyle('bold')]}>{name}</Text>
          <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center' }}>
            {(profile.headline as string) || (profile.currentCompany as string) || 'Professional'}
          </Text>
          {profile.location ? (
            <Text style={{ color: colors.muted, marginTop: 6 }}>{String(profile.location)}</Text>
          ) : null}
          <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>
            {data.connectionCount} connections
            {data.mutualConnections.count > 0
              ? ` · ${data.mutualConnections.count} mutual`
              : ''}
          </Text>
        </View>

        <View style={styles.actions}>
          {data.connectionStatus === 'ACCEPTED' ? (
            <>
              <Pressable
                onPress={() => router.push(`/messages?with=${userId}` as never)}
                style={[styles.btnPrimary, { backgroundColor: colors.blue }]}
              >
                <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Message</Text>
              </Pressable>
              <Pressable
                disabled={actionLoading}
                onPress={() => void runAction(() => removeConnection(userId!))}
                style={[styles.btnSecondary, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.heading, ...fontStyle('semibold') }}>Remove connection</Text>
              </Pressable>
            </>
          ) : data.connectionStatus === 'PENDING' && data.connectionDirection === 'received' && data.connectionId ? (
            <>
              <Pressable
                disabled={actionLoading}
                onPress={() => void runAction(() => acceptConnection(data.connectionId!))}
                style={[styles.btnPrimary, { backgroundColor: colors.blue }]}
              >
                <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Accept</Text>
              </Pressable>
              <Pressable
                disabled={actionLoading}
                onPress={() => void runAction(() => rejectConnection(data.connectionId!))}
                style={[styles.btnSecondary, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.heading, ...fontStyle('semibold') }}>Ignore</Text>
              </Pressable>
            </>
          ) : data.connectionStatus === 'PENDING' && data.connectionId ? (
            <Pressable
              disabled={actionLoading}
              onPress={() => void runAction(() => cancelConnection(data.connectionId!))}
              style={[styles.btnSecondary, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.muted, ...fontStyle('semibold') }}>Withdraw request</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowInvite(true)}
              style={[styles.btnPrimary, { backgroundColor: colors.blue }]}
            >
              <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Connect</Text>
            </Pressable>
          )}
        </View>

        {profile.summary ? (
          <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>About</Text>
            <Text style={{ color: colors.muted, lineHeight: 22 }}>{String(profile.summary)}</Text>
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.heading }, fontStyle('bold')]}>Skills</Text>
            <View style={styles.skills}>
              {skills.map((skill) => (
                <View key={skill} style={[styles.skill, { backgroundColor: `${colors.blue}14` }]}>
                  <Text style={{ color: colors.blue, fontSize: 12, ...fontStyle('medium') }}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <ConnectInviteModal
        visible={showInvite}
        userId={userId!}
        fullName={name}
        onClose={() => setShowInvite(false)}
        onSent={() => {
          setShowInvite(false);
          void load();
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  banner: { height: 120 },
  header: { alignItems: 'center', paddingHorizontal: theme.spacing.md, marginTop: -40 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  name: { marginTop: 12, fontSize: 22, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', padding: theme.spacing.md },
  btnPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  btnSecondary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, borderWidth: 1 },
  section: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  error: { color: '#dc2626', textAlign: 'center', padding: 12 },
});
