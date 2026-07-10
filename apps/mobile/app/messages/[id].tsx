import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import {
  KeyboardStickyView,
  useKeyboardState,
  useResizeMode,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '@/components/app-screen';
import { MessageAttachmentContent } from '@/components/messages/message-attachment-content';
import { MessageComposeField } from '@/components/messages/message-compose-field';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import {
  buildMessageRows,
  formatMessageTime,
  type MessageListRow,
} from '@/lib/message-format';
import {
  fetchConversation,
  fetchMessages,
  notifyMessagesRefresh,
  sendMessage,
  type MessageAttachment,
  type MessageItem,
} from '@/lib/messages';
import { resolveAvatarUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const COMPOSE_INPUT_ID = 'message-compose-input';

export default function MessageThreadScreen() {
  useResizeMode();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const listRef = useRef<FlatList<MessageListRow>>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchConversation>> | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [sending, setSending] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');

  const rows = useMemo(() => buildMessageRows(messages), [messages]);
  const composeBottomPad = keyboardVisible ? 8 : Math.max(insets.bottom, 8);

  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [conv, msgs] = await Promise.all([fetchConversation(id), fetchMessages(id)]);
      setDetail(conv);
      setMessages(msgs.items);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load conversation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!rows.length) return;
    const timer = setTimeout(() => scrollToEnd(true), 100);
    return () => clearTimeout(timer);
  }, [rows.length, id, scrollToEnd]);

  useEffect(() => {
    if (!keyboardVisible) return;
    scrollToEnd(true);
  }, [keyboardVisible, scrollToEnd]);

  const pendingInvite =
    detail?.connectionStatus === 'PENDING' &&
    detail.connectionDirection === 'received' &&
    detail.connectionId;

  async function handleSend() {
    if (!id || (!text.trim() && !attachment)) return;
    setSending(true);
    setError('');
    try {
      const msg = await sendMessage(id, text.trim(), attachment ?? undefined);
      setMessages((prev) => [...prev, msg]);
      setText('');
      setAttachment(null);
      notifyMessagesRefresh();
      scrollToEnd(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  async function handleAcceptInvite() {
    if (!detail?.connectionId) return;
    setInviteLoading(true);
    try {
      await acceptConnectionInvite(detail.connectionId);
      await load();
      notifyMessagesRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept invitation');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleIgnoreInvite() {
    if (!detail?.connectionId) return;
    setInviteLoading(true);
    try {
      await ignoreConnectionInvite(detail.connectionId);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not ignore invitation');
    } finally {
      setInviteLoading(false);
    }
  }

  if (loading || !detail) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.blue} size="large" />
        </View>
      </AppScreen>
    );
  }

  const person = detail.otherUser;
  const avatar = resolveAvatarUrl(person.avatarUrl);
  const name = person.fullName?.trim() || 'Professional';

  return (
    <AppScreen>
      <View style={styles.flex}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surfaceElevated,
              paddingTop: insets.top + theme.spacing.xs,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={colors.heading} />
          </Pressable>
          <Pressable onPress={() => router.push(`/network/${person.userId}` as never)} style={styles.headerMain}>
            <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[fontStyle('bold'), { color: colors.heading }]}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={[fontStyle('bold'), { color: colors.heading, fontSize: 16 }]}>
                {name}
              </Text>
              {person.headline ? (
                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>
                  {person.headline}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </View>

        {pendingInvite ? (
          <View
            style={[
              styles.inviteBar,
              {
                backgroundColor: `${colors.blue}14`,
                borderColor: `${colors.blue}33`,
              },
            ]}
          >
            <Text style={{ color: colors.heading, fontSize: 13, flex: 1, ...fontStyle('medium') }}>
              {name} invited you to connect
            </Text>
            <Pressable disabled={inviteLoading} onPress={() => void handleIgnoreInvite()} style={styles.inviteBtn}>
              <Text style={{ color: colors.heading, ...fontStyle('semibold'), fontSize: 12 }}>Ignore</Text>
            </Pressable>
            <Pressable
              disabled={inviteLoading}
              onPress={() => void handleAcceptInvite()}
              style={[styles.inviteBtn, { backgroundColor: colors.blue }]}
            >
              <Text style={{ color: '#fff', ...fontStyle('semibold'), fontSize: 12 }}>Accept</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.chatBody}>
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onContentSizeChange={() => scrollToEnd(false)}
            renderItem={({ item }) => {
              if (item.type === 'day') {
                return (
                  <View style={styles.dayWrap}>
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: colors.muted, backgroundColor: colors.surface },
                        fontStyle('semibold'),
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              }
              const message = item.item;
              const showBody =
                message.body.trim().length > 0 &&
                !(message.attachmentUrl && message.body.trim().startsWith('📎'));
              return (
                <View
                  style={[
                    styles.bubble,
                    message.isMine
                      ? { alignSelf: 'flex-end', backgroundColor: colors.blue }
                      : {
                          alignSelf: 'flex-start',
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                  ]}
                >
                  {showBody ? (
                    <Text style={{ color: message.isMine ? '#fff' : colors.heading, fontSize: 15, lineHeight: 21 }}>
                      {message.body}
                    </Text>
                  ) : null}
                  {message.attachmentUrl && message.attachmentFileName ? (
                    <MessageAttachmentContent
                      url={message.attachmentUrl}
                      fileName={message.attachmentFileName}
                      mimeType={message.attachmentMimeType}
                      isMine={message.isMine}
                    />
                  ) : null}
                  <Text
                    style={{
                      color: message.isMine ? 'rgba(255,255,255,0.75)' : colors.muted,
                      fontSize: 10,
                      marginTop: 4,
                      alignSelf: 'flex-end',
                      ...fontStyle('medium'),
                    }}
                  >
                    {formatMessageTime(message.createdAt)}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyThread}>
                <Text style={{ color: colors.muted, textAlign: 'center', ...fontStyle('regular') }}>
                  {detail.canReply ? 'Say hello — your conversation starts here.' : 'Connect to start messaging.'}
                </Text>
              </View>
            }
          />

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <KeyboardStickyView
            style={[
              styles.compose,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                paddingBottom: composeBottomPad,
              },
            ]}
          >
            <MessageComposeField
              inputId={COMPOSE_INPUT_ID}
              value={text}
              onChange={setText}
              attachment={attachment}
              onAttachmentChange={setAttachment}
              onSubmit={() => void handleSend()}
              sending={sending}
              editable={detail.canReply}
              placeholder={detail.canReply ? 'Write a message…' : 'Connect to reply'}
              onFocus={() => scrollToEnd(true)}
            />
          </KeyboardStickyView>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chatBody: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    marginLeft: -theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  inviteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  inviteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  messages: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  dayWrap: { alignItems: 'center', marginVertical: 10 },
  dayLabel: {
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  emptyThread: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  compose: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  error: {
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});
