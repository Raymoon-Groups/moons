import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FeedPost } from '@moons/shared';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { notifyMessagesRefresh, sendMessageToUser } from '@/lib/messages';
import { fetchConnections, type ConnectionListItem } from '@/lib/network';
import { postSharePreview } from '@/lib/post-share';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function ForwardPostModal({
  visible,
  post,
  onClose,
}: {
  visible: boolean;
  post: FeedPost;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSelected(new Set());
    setNote('');
    setError('');
    setLoading(true);
    void fetchConnections(1)
      .then((data) => setConnections(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load connections'))
      .finally(() => setLoading(false));
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        },
        sheet: {
          maxHeight: '88%',
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          borderWidth: 1,
          paddingBottom: 20,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        noteWrap: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        input: {
          minHeight: 72,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          padding: 12,
          textAlignVertical: 'top',
          fontSize: 15,
          marginTop: 8,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: theme.radius.lg,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarImg: { width: 40, height: 40, borderRadius: 20 },
        check: {
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
        },
        footer: {
          paddingHorizontal: 16,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        sendBtn: {
          height: 46,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
      }),
    [],
  );

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleForward() {
    if (selected.size === 0) return;
    setSending(true);
    setError('');
    const shared = postSharePreview(post);
    const message = [
      note.trim() || `Shared a post from ${shared.author}`,
      shared.preview,
      shared.url,
    ]
      .filter(Boolean)
      .join('\n\n');

    const failures: string[] = [];
    let ok = 0;
    for (const userId of selected) {
      try {
        await sendMessageToUser(userId, message);
        ok += 1;
      } catch {
        const name =
          connections.find((c) => c.user.userId === userId)?.user.fullName?.trim() || 'Someone';
        failures.push(name);
      }
    }

    notifyMessagesRefresh();
    setSending(false);

    if (failures.length) {
      setError(`Sent to ${ok}. Failed for: ${failures.join(', ')}`);
      return;
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[{ color: colors.heading, fontSize: 17 }, fontStyle('bold')]}>
              Send to connection
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ color: colors.muted, ...fontStyle('semibold') }}>Close</Text>
            </Pressable>
          </View>

          <View style={[styles.noteWrap, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 12, ...fontStyle('semibold') }}>
              Add a note (optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Say something about this post…"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
              style={[
                styles.input,
                {
                  color: colors.heading,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            />
          </View>

          {loading ? (
            <ActivityIndicator color={colors.blue} style={{ marginVertical: 32 }} />
          ) : connections.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: 'center', marginVertical: 32, paddingHorizontal: 24 }}>
              No connections yet. Connect with people to share posts.
            </Text>
          ) : (
            <FlatList
              data={connections}
              keyExtractor={(item) => item.connectionId}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ padding: 8 }}
              renderItem={({ item }) => {
                const checked = selected.has(item.user.userId);
                const avatar = resolveAssetUrl(item.user.avatarUrl);
                return (
                  <Pressable
                    onPress={() => toggle(item.user.userId)}
                    style={[
                      styles.row,
                      checked ? { backgroundColor: `${colors.blue}18` } : undefined,
                    ]}
                  >
                    <View
                      style={[
                        styles.check,
                        checked
                          ? { borderColor: colors.blue, backgroundColor: colors.blue }
                          : { borderColor: colors.border, backgroundColor: colors.surface },
                      ]}
                    >
                      {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                    <View
                      style={[styles.avatar, { backgroundColor: `${colors.blue}22` }]}
                    >
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatarImg} />
                      ) : (
                        <Text style={{ color: colors.blue, ...fontStyle('bold') }}>
                          {(item.user.fullName?.[0] || '?').toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: colors.heading, ...fontStyle('semibold') }}
                        numberOfLines={1}
                      >
                        {item.user.fullName?.trim() || 'Member'}
                      </Text>
                      {item.user.headline ? (
                        <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
                          {item.user.headline}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {error ? (
              <Text style={{ color: colors.error, fontSize: 13, marginBottom: 8 }}>{error}</Text>
            ) : null}
            <Pressable
              onPress={() => void handleForward()}
              disabled={sending || selected.size === 0}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: colors.blue,
                  opacity: sending || selected.size === 0 ? 0.55 : 1,
                },
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', ...fontStyle('semibold') }}>
                    {selected.size ? `Send to ${selected.size}` : 'Select connections'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
