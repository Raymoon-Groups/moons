import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { MessageAttachmentContent } from '@/components/messages/message-attachment-content';
import { formatMessageTime } from '@/lib/message-format';
import type { MessageItem } from '@/lib/messages';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

/** Lime-green accent for timestamp labels (reference chat UI), brand-aware in light mode. */
function timeAccent(isDark: boolean, blue: string) {
  return isDark ? '#b8e62e' : blue;
}

export function MessageDayDivider({ label }: { label: string }) {
  const { colors, isDark } = useTheme();
  const accent = timeAccent(isDark, colors.blue);

  return (
    <View style={styles.dayWrap}>
      <Text style={[styles.dayLabel, { color: accent }, fontStyle('semibold')]}>{label}</Text>
    </View>
  );
}

export function MessageBubble({
  message,
  showAvatar,
  isFirstInGroup,
  isLastInGroup,
  senderName,
  senderAvatarUrl,
}: {
  message: MessageItem;
  showAvatar: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  senderName: string;
  senderAvatarUrl?: string | null;
}) {
  const { colors, isDark } = useTheme();
  const showBody =
    message.body.trim().length > 0 &&
    !(message.attachmentUrl && message.body.trim().startsWith('📎'));

  const marginTop = isFirstInGroup ? 14 : 4;
  const hasAttachment = Boolean(message.attachmentUrl && message.attachmentFileName);
  const read = Boolean(message.readAt);
  const accent = timeAccent(isDark, colors.blue);

  // Pill-style bubbles — soft rounded chat style from the reference UI.
  const bubbleCorners = {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: message.isMine ? 22 : isLastInGroup ? 8 : 22,
    borderBottomRightRadius: message.isMine ? (isLastInGroup ? 8 : 22) : 22,
  };

  const outgoingBg = isDark ? 'rgba(63, 116, 204, 0.42)' : colors.blue;
  const incomingBg = isDark ? 'rgba(28, 36, 52, 0.92)' : '#ffffff';
  const bodyColor = message.isMine
    ? isDark
      ? '#f5f8ff'
      : '#ffffff'
    : isDark
      ? '#f0f4fa'
      : colors.heading;
  const metaColor = message.isMine
    ? isDark
      ? 'rgba(230, 238, 255, 0.7)'
      : 'rgba(255,255,255,0.78)'
    : colors.muted;

  const bubble = (
    <View
      style={[
        styles.bubble,
        bubbleCorners,
        {
          marginTop,
          backgroundColor: message.isMine ? outgoingBg : incomingBg,
          borderColor: message.isMine
            ? isDark
              ? 'rgba(99, 140, 210, 0.35)'
              : 'transparent'
            : isDark
              ? 'rgba(80, 96, 120, 0.45)'
              : 'rgba(15,28,51,0.06)',
          borderWidth: StyleSheet.hairlineWidth,
        },
        message.isMine ? styles.bubbleMine : styles.bubbleTheirs,
      ]}
    >
      {!message.isMine && isFirstInGroup ? (
        <Text style={[styles.senderName, { color: accent }, fontStyle('semibold')]} numberOfLines={1}>
          {senderName}
        </Text>
      ) : null}

      {showBody ? (
        <Text style={[styles.body, { color: bodyColor }, fontStyle('regular')]}>{message.body}</Text>
      ) : null}

      {hasAttachment ? (
        <MessageAttachmentContent
          url={message.attachmentUrl!}
          fileName={message.attachmentFileName!}
          mimeType={message.attachmentMimeType}
          isMine={message.isMine}
        />
      ) : null}

      <View style={[styles.metaRow, !showBody && !hasAttachment ? { marginTop: 2 } : null]}>
        <Text style={[styles.time, { color: metaColor }, fontStyle('medium')]}>
          {formatMessageTime(message.createdAt)}
        </Text>
        {message.isMine ? (
          <Ionicons
            name={read ? 'checkmark-done' : 'checkmark'}
            size={13}
            color={
              read
                ? isDark
                  ? '#b8e62e'
                  : 'rgba(255,255,255,0.95)'
                : metaColor
            }
            style={styles.check}
          />
        ) : null}
      </View>
    </View>
  );

  if (message.isMine) {
    return <View style={[styles.row, styles.rowMine]}>{bubble}</View>;
  }

  return (
    <View style={[styles.row, styles.rowTheirs]}>
      <View style={styles.avatarSlot}>
        {showAvatar ? (
          <View
            style={[
              styles.avatar,
              {
                borderColor: isDark ? 'rgba(80, 96, 120, 0.6)' : '#fff',
                backgroundColor: isDark ? colors.surface : `${colors.blue}14`,
              },
            ]}
          >
            {senderAvatarUrl ? (
              <Image source={{ uri: senderAvatarUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={[styles.avatarLetter, { color: colors.blue }, fontStyle('bold')]}>
                {senderName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        ) : null}
      </View>
      <View style={styles.bubbleColumn}>{bubble}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayWrap: {
    alignItems: 'flex-start',
    marginTop: 18,
    marginBottom: 6,
    paddingLeft: 4,
  },
  dayLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  avatarSlot: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 12 },
  bubbleColumn: {
    maxWidth: '78%',
    minWidth: 0,
  },
  bubble: {
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    maxWidth: '84%',
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 5,
  },
  time: {
    fontSize: 10,
    lineHeight: 13,
  },
  check: {
    marginTop: 0.5,
  },
});
