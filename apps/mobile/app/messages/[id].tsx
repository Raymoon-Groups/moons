import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
} from 'react-native';
import { Image } from 'expo-image';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  useKeyboardState,
  useResizeMode,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '@/components/app-screen';
import { MessageBubble, MessageDayDivider } from '@/components/messages/message-bubble';
import { MessageComposeField } from '@/components/messages/message-compose-field';
import { ViewableAvatar } from '@/components/profile/protected-avatar-viewer';
import {
  acceptConnectionInvite,
  ignoreConnectionInvite,
} from '@/lib/connection-invites';
import {
  buildMessageRows,
  type MessageListRow,
} from '@/lib/message-format';
import {
  fetchConversation,
  fetchMessages,
  MESSAGE_FETCH_LIMIT,
  MESSAGE_THREAD_POLL_MS,
  notifyMessagesRefresh,
  sendMessage,
  type MessageAttachment,
  type MessageItem,
} from '@/lib/messages';
import { resolveAvatarUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { subscribeRefresh } from '@/lib/refresh-events';
import {
  notifyPossibleIncomingMessage,
  prepareMessageSound,
  setThreadMessageBaseline,
} from '@/lib/message-sound';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const COMPOSE_INPUT_ID = 'message-compose-input';
const COMPOSE_BAR_SPACE = 76;

function messagesChanged(prev: MessageItem[], next: MessageItem[]) {
  if (prev.length !== next.length) return true;
  return !prev.every((message, index) => message.id === next[index]?.id);
}

function applyThreadMessages(
  setMessages: Dispatch<SetStateAction<MessageItem[]>>,
  next: MessageItem[],
): boolean {
  let changed = false;
  setMessages((prev) => {
    if (!messagesChanged(prev, next)) return prev;
    changed = true;
    return next;
  });
  return changed;
}

export default function MessageThreadScreen() {
  useResizeMode();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardState((state) => state.height);
  const listRef = useRef<FlatList<MessageListRow>>(null);
  const stickToBottomRef = useRef(true);
  const refreshingRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const openScrollDoneRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchConversation>> | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [sending, setSending] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [composeHeight, setComposeHeight] = useState(COMPOSE_BAR_SPACE);

  const rows = useMemo(() => buildMessageRows(messages), [messages]);
  const listData = useMemo(() => [...rows].reverse(), [rows]);
  const listInverted = listData.length > 0;
  const composeBottomPad = Math.max(insets.bottom, 10);
  const stickyOffsetOpened = Math.max(composeBottomPad - theme.spacing.sm, 0);

  const onComposeLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) setComposeHeight(height);
  }, []);

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <KeyboardAwareScrollView
        {...props}
        extraKeyboardSpace={composeHeight}
        bottomOffset={theme.spacing.sm}
        disableScrollOnKeyboardHide
      />
    ),
    [composeHeight],
  );

  const scrollToEnd = useCallback(
    (animated = true) => {
      requestAnimationFrame(() => {
        if (!listRef.current) return;
        if (listInverted) {
          listRef.current.scrollToOffset({ offset: 0, animated });
        } else {
          listRef.current.scrollToEnd({ animated });
        }
      });
    },
    [listInverted],
  );

  const scrollToLatest = useCallback(
    (animated = true) => {
      stickToBottomRef.current = true;
      scrollToEnd(animated);
    },
    [scrollToEnd],
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [conv, msgs] = await Promise.all([
        fetchConversation(id),
        fetchMessages(id, 1, MESSAGE_FETCH_LIMIT),
      ]);
      setDetail(conv);
      applyThreadMessages(setMessages, msgs.items);
      const latest = msgs.items[msgs.items.length - 1];
      lastMessageIdRef.current = latest?.id ?? null;
      setThreadMessageBaseline(id, msgs.items);
      stickToBottomRef.current = true;
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load conversation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refreshMessages = useCallback(async () => {
    if (!id || refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const msgs = await fetchMessages(id, 1, MESSAGE_FETCH_LIMIT);
      const changed = applyThreadMessages(setMessages, msgs.items);
      const latest = msgs.items[msgs.items.length - 1];
      if (latest) {
        notifyPossibleIncomingMessage(id, latest);
      }
      if (changed && latest && latest.id !== lastMessageIdRef.current) {
        const incoming = !latest.isMine;
        lastMessageIdRef.current = latest.id;
        if (stickToBottomRef.current || incoming) {
          scrollToEnd(true);
        }
      } else if (latest) {
        lastMessageIdRef.current = latest.id;
      }
    } catch {
      // ignore background refresh errors
    } finally {
      refreshingRef.current = false;
    }
  }, [id, scrollToEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void prepareMessageSound();
      void refreshMessages();
      if (openScrollDoneRef.current) {
        scrollToLatest(true);
      }
    }, [refreshMessages, scrollToLatest]),
  );

  useEffect(() => {
    if (!id) return;

    const refresh = () => {
      void refreshMessages();
    };

    refresh();

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        refresh();
      }
    }, MESSAGE_THREAD_POLL_MS);

    const unsubMessages = subscribeRefresh('moons:messages-refresh', refresh);
    const unsubNotifications = subscribeRefresh('moons:notifications-refresh', refresh);
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });

    return () => {
      clearInterval(interval);
      unsubMessages();
      unsubNotifications();
      appSub.remove();
    };
  }, [id, refreshMessages]);

  useEffect(() => {
    openScrollDoneRef.current = false;
    fadeAnim.setValue(0);
  }, [id, fadeAnim]);

  useEffect(() => {
    if (loading || !rows.length) return;

    const timer = setTimeout(() => {
      if (!openScrollDoneRef.current) {
        openScrollDoneRef.current = true;
        if (listInverted) {
          listRef.current?.scrollToOffset({ offset: 72, animated: false });
          requestAnimationFrame(() => {
            scrollToEnd(true);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
            }).start();
          });
        } else {
          scrollToEnd(false);
          requestAnimationFrame(() => {
            scrollToEnd(true);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
            }).start();
          });
        }
        return;
      }

      scrollToEnd(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [loading, rows.length, listInverted, scrollToEnd, fadeAnim]);

  useEffect(() => {
    if (keyboardHeight <= 0) return;
    const timers = [
      setTimeout(() => scrollToLatest(false), 16),
      setTimeout(() => scrollToLatest(true), 120),
      setTimeout(() => scrollToLatest(true), 320),
    ];
    return () => timers.forEach(clearTimeout);
  }, [keyboardHeight, scrollToLatest]);

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
      stickToBottomRef.current = true;
      lastMessageIdRef.current = msg.id;
      setMessages((prev) => [...prev, msg]);
      setText('');
      setAttachment(null);
      notifyMessagesRefresh();
      scrollToLatest(true);
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
      await acceptConnectionInvite(detail.connectionId, { fullName: detail.otherUser.fullName });
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

  const statusLine = person.headline?.trim() || (detail.canReply ? 'Tap to view profile' : 'Not connected yet');

  return (
    <AppScreen>
      <View style={styles.flex}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? 'rgba(50, 64, 88, 0.6)' : 'rgba(15,28,51,0.06)',
              backgroundColor: isDark ? '#0d1420' : '#ffffff',
              paddingTop: insets.top + 6,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.blue} />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/network/${person.userId}` as never)}
            style={styles.headerMain}
            accessibilityLabel={`Open ${name} profile`}
          >
            <ViewableAvatar uri={avatar} name={name}>
              <View
                style={[
                  styles.avatar,
                  {
                    borderColor: isDark ? colors.border : `${colors.blue}22`,
                    backgroundColor: isDark ? colors.surface : `${colors.blue}12`,
                  },
                ]}
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
                ) : (
                  <Text style={[fontStyle('bold'), { color: colors.blue, fontSize: 18 }]}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </ViewableAvatar>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={[fontStyle('bold'), { color: colors.heading, fontSize: 17 }]}>
                {name}
              </Text>
              <Text numberOfLines={1} style={[styles.headerStatus, { color: colors.muted }, fontStyle('medium')]}>
                {statusLine}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {pendingInvite ? (
          <View
            style={[
              styles.inviteBar,
              {
                backgroundColor: `${colors.blue}12`,
                borderColor: `${colors.blue}28`,
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

        <View style={styles.chatStage}>
          <View
            style={[
              styles.flex,
              keyboardHeight > 0 ? { marginBottom: keyboardHeight } : null,
            ]}
          >
            <Animated.View
              style={[
                styles.chatBody,
                {
                  backgroundColor: isDark ? '#0a0f18' : '#eef3f9',
                  opacity: rows.length ? fadeAnim : 1,
                },
              ]}
            >
              <FlatList
                ref={listRef}
                style={styles.flex}
                data={listData}
                inverted={listInverted}
                renderScrollComponent={renderScrollComponent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.messages,
                  listInverted
                    ? { paddingTop: composeHeight + theme.spacing.xs }
                    : { paddingBottom: composeHeight + theme.spacing.xs },
                  !listInverted && styles.messagesEmptyGrow,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                onScroll={(event) => {
                  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                  if (listInverted) {
                    stickToBottomRef.current = contentOffset.y < 120;
                    return;
                  }
                  const distanceFromBottom =
                    contentSize.height - layoutMeasurement.height - contentOffset.y;
                  stickToBottomRef.current = distanceFromBottom < 120;
                }}
                scrollEventThrottle={16}
                onContentSizeChange={() => {
                  if (stickToBottomRef.current) scrollToEnd(false);
                }}
                onLayout={() => {
                  if (stickToBottomRef.current) scrollToEnd(false);
                }}
                renderItem={({ item }) => {
                  if (item.type === 'day') {
                    return <MessageDayDivider label={item.label} />;
                  }

                  return (
                    <MessageBubble
                      message={item.item}
                      showAvatar={item.showAvatar}
                      isFirstInGroup={item.isFirstInGroup}
                      isLastInGroup={item.isLastInGroup}
                      senderName={name}
                      senderAvatarUrl={avatar}
                    />
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyThread}>
                    <View
                      style={[
                        styles.emptyAvatar,
                        {
                          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
                          borderColor: isDark ? colors.border : `${colors.blue}22`,
                        },
                      ]}
                    >
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.emptyAvatarImg} contentFit="cover" />
                      ) : (
                        <Text style={[fontStyle('bold'), { color: colors.blue, fontSize: 28 }]}>
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.heading }, fontStyle('bold')]}>{name}</Text>
                    <Text style={[{ color: colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 20 }, fontStyle('regular')]}>
                      {detail.canReply
                        ? 'Say hello — your conversation starts here.'
                        : 'Connect to start messaging.'}
                    </Text>
                  </View>
                }
              />

              {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
            </Animated.View>
          </View>

          <KeyboardStickyView
            offset={{ closed: 0, opened: stickyOffsetOpened }}
            style={styles.composeSticky}
          >
            <View
              onLayout={onComposeLayout}
              style={[
                styles.compose,
                {
                  borderTopColor: isDark ? 'rgba(50, 64, 88, 0.6)' : 'rgba(15,28,51,0.06)',
                  backgroundColor: isDark ? '#0d1420' : '#ffffff',
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
                placeholder={detail.canReply ? 'Type here' : 'Connect to reply'}
                onFocus={() => scrollToLatest(true)}
              />
            </View>
          </KeyboardStickyView>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chatStage: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  chatBody: {
    flex: 1,
    minHeight: 0,
  },
  composeSticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  headerStatus: {
    fontSize: 12,
    marginTop: 1,
  },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  messages: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: 2,
  },
  messagesEmptyGrow: {
    flexGrow: 1,
  },
  emptyThread: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  emptyAvatarImg: { width: '100%', height: '100%' },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  compose: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  error: {
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});
