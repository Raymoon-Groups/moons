import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PersonCard } from '@/components/network/person-card';
import {
  fetchConnections,
  fetchPendingReceived,
  fetchPendingSent,
  fetchProfileVisitors,
  type ConnectionListItem,
  type PendingRequestItem,
  type ProfileVisitorItem,
} from '@/lib/network';
import { ApiError } from '@/lib/api';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const SECTION_TABS = [
  { id: 'connections', label: 'Connections' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent', label: 'Sent' },
  { id: 'visitors', label: 'Visitors' },
] as const;

type SectionTab = (typeof SECTION_TABS)[number]['id'];

export function ProfileNetworkSection() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<SectionTab>('connections');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [pending, setPending] = useState<PendingRequestItem[]>([]);
  const [sent, setSent] = useState<PendingRequestItem[]>([]);
  const [visitors, setVisitors] = useState<ProfileVisitorItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      switch (tab) {
        case 'connections': {
          const data = await fetchConnections();
          setConnections(data.items);
          break;
        }
        case 'pending': {
          const data = await fetchPendingReceived();
          setPending(data.items);
          break;
        }
        case 'sent': {
          const data = await fetchPendingSent();
          setSent(data.items);
          break;
        }
        case 'visitors': {
          const data = await fetchProfileVisitors();
          setVisitors(data.items);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[{ color: colors.heading, fontSize: 16 }, fontStyle('bold')]}>My network</Text>
        <Text style={[{ color: colors.muted, fontSize: 12, marginTop: 4 }, fontStyle('regular')]}>
          Connections and visitors. Respond to invites from the banner or Notifications.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {SECTION_TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && { borderBottomColor: colors.blue, borderBottomWidth: 2 }]}
            >
              <Text
                style={[
                  { fontSize: 13 },
                  active ? { color: colors.blue, ...fontStyle('bold') } : { color: colors.muted, ...fontStyle('semibold') },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.body}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: `${colors.error}33` }]}>
            <Text style={{ color: colors.error, fontSize: 13, ...fontStyle('medium') }}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color={colors.blue} />
        ) : tab === 'connections' ? (
          connections.length === 0 ? (
            <Empty message="No connections yet. Visit My Network to find people to connect with." colors={colors} />
          ) : (
            connections.map((item) => (
              <PersonCard
                key={item.connectionId}
                person={{
                  ...item.user,
                  connectionStatus: 'ACCEPTED',
                  connectionId: item.connectionId,
                }}
                onUpdated={load}
              />
            ))
          )
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <Empty message="No pending connection requests." colors={colors} />
          ) : (
            pending.map((item) =>
              item.fromUser ? (
                <PersonCard
                  key={item.id}
                  person={{
                    ...item.fromUser,
                    connectionStatus: 'PENDING',
                    connectionId: item.id,
                    connectionDirection: 'received',
                  }}
                  onUpdated={load}
                />
              ) : null,
            )
          )
        ) : tab === 'sent' ? (
          sent.length === 0 ? (
            <Empty message="You have not sent any connection requests." colors={colors} />
          ) : (
            sent.map((item) =>
              item.toUser ? (
                <PersonCard
                  key={item.id}
                  person={{
                    ...item.toUser,
                    connectionStatus: 'PENDING',
                    connectionId: item.id,
                    connectionDirection: 'sent',
                  }}
                  onUpdated={load}
                />
              ) : null,
            )
          )
        ) : visitors.length === 0 ? (
          <Empty message="No profile visitors yet." colors={colors} />
        ) : (
          visitors.map((item, index) => (
            <View key={`${item.viewer.userId}-${index}`}>
              <PersonCard person={item.viewer} onUpdated={load} />
              <Text style={[{ color: colors.muted, fontSize: 11, marginTop: -6, marginBottom: 8, paddingHorizontal: 4 }, fontStyle('regular')]}>
                Viewed{' '}
                {new Date(item.viewedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function Empty({ message, colors }: { message: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Text style={[{ color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: 24 }, fontStyle('regular')]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.md,
  },
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  body: { padding: theme.spacing.md },
  errorBox: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
});
