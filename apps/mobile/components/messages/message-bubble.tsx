import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { MessageAttachmentContent } from '@/components/messages/message-attachment-content';
import { formatMessageTime } from '@/lib/message-format';
import type { MessageItem } from '@/lib/messages';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function MessageDayDivider({ label }: { label: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.dayWrap}>
      <View style={[styles.dayLine, { backgroundColor: colors.border }]} />
      <Text
        style={[
          styles.dayLabel,
          {
            color: colors.muted,
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
          fontStyle('semibold'),
        ]}
      >
        {label}
      </Text>
      <View style={[styles.dayLine, { backgroundColor: colors.border }]} />
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

  const marginTop = isFirstInGroup ? 10 : 3;
  const marginBottom = isLastInGroup ? 4 : 0;

  const incomingBubbleStyle = {
    backgroundColor: colors.surfaceElevated,
    borderColor: isDark ? colors.border : `${colors.border}`,
  };

  const outgoingBubbleStyle = {
    backgroundColor: colors.blue,
  };

  const bubbleCorners = message.isMine
    ? {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: isLastInGroup ? 6 : 18,
      }
    : {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: isLastInGroup ? 6 : 18,
        borderBottomRightRadius: 18,
      };

  const bubble = (
    <View
      style={[
        styles.bubble,
        bubbleCorners,
        message.isMine ? outgoingBubbleStyle : incomingBubbleStyle,
        message.isMine ? styles.bubbleMine : styles.bubbleTheirs,
        { marginTop, marginBottom, borderWidth: message.isMine ? 0 : 1 },
      ]}
    >
      {showBody ? (
        <Text
          style={[
            styles.body,
            { color: message.isMine ? '#fff' : colors.heading },
            message.isMine ? fontStyle('regular') : fontStyle('regular'),
          ]}
        >
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
        style={[
          styles.time,
          { color: message.isMine ? 'rgba(255,255,255,0.78)' : colors.muted },
          fontStyle('medium'),
        ]}
      >
        {formatMessageTime(message.createdAt)}
      </Text>
    </View>
  );

  if (message.isMine) {
    return <View style={[styles.row, styles.rowMine, { marginBottom: isLastInGroup ? 2 : 0 }]}>{bubble}</View>;
  }

  return (
    <View style={[styles.row, styles.rowTheirs, { marginBottom: isLastInGroup ? 2 : 0 }]}>
      <View style={styles.avatarSlot}>
        {showAvatar ? (
          <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  dayLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
  dayLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    overflow: 'hidden',
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
    width: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
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
    borderColor: 'transparent',
    alignSelf: 'flex-end',
    ...theme.shadow.soft,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    ...theme.shadow.card,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
});
