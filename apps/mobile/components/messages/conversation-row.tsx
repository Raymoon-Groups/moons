import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ConversationPreview } from '@/lib/messages';
import { truncateMessagePreview } from '@/lib/messages';
import { formatConversationTime } from '@/lib/message-format';
import { resolveAvatarUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

type PreviewKind = {
  icon: keyof typeof Ionicons.glyphMap | null;
  text: string;
  showSentChecks: boolean;
};

function buildPreview(conversation: ConversationPreview): PreviewKind {
  const last = conversation.lastMessage;
  if (!last) {
    return { icon: null, text: 'No messages yet', showSentChecks: false };
  }

  const isMine = last.isMine;
  const body = last.body.trim();

  if (body.startsWith('📎')) {
    const fileName = body.replace(/^📎\s*/, '').trim();
    const lower = fileName.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|heic|bmp)$/.test(lower)) {
      return { icon: 'camera-outline', text: 'Photo', showSentChecks: isMine };
    }
    if (/\.(mp4|mov|webm|m4v|mkv)$/.test(lower)) {
      return { icon: 'document-outline', text: fileName || 'Video', showSentChecks: isMine };
    }
    if (/\.(m4a|mp3|wav|aac|ogg|caf)$/.test(lower)) {
      return { icon: 'mic-outline', text: fileName || 'Audio', showSentChecks: isMine };
    }
    return {
      icon: 'document-outline',
      text: fileName || 'Document',
      showSentChecks: isMine,
    };
  }

  return {
    icon: null,
    text: truncateMessagePreview(body, 60),
    showSentChecks: isMine,
  };
}

/** Soft presence: recent activity (no real presence API). */
function isRecentlyActive(conversation: ConversationPreview) {
  const iso = conversation.lastMessage?.createdAt || conversation.updatedAt;
  if (!iso) return false;
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  return mins >= 0 && mins < 25;
}

export function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationPreview;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const person = conversation.otherUser;
  const avatar = resolveAvatarUrl(person.avatarUrl);
  const name = person.fullName?.trim() || 'Professional';
  const unread = conversation.unreadCount > 0;
  const preview = buildPreview(conversation);
  const time = conversation.lastMessage
    ? formatConversationTime(conversation.lastMessage.createdAt)
    : formatConversationTime(conversation.updatedAt);
  const online = isRecentlyActive(conversation);

  const previewColor = unread ? colors.foreground : colors.muted;
  const checkColor = unread ? colors.muted : colors.blue;
  const pressedBg = isDark ? colors.surfaceHover : `${colors.blue}0c`;
  const unreadRowBg = isDark ? `${colors.blue}12` : `${colors.blue}08`;
  const avatarBg = isDark ? colors.surface : `${colors.blue}14`;
  const onlineBorder = isDark ? colors.background : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: `${colors.blue}18`, borderless: false }}
      style={({ pressed }) => [
        styles.row,
        unread && { backgroundColor: unreadRowBg },
        pressed && { backgroundColor: pressedBg },
      ]}
    >
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={[styles.avatarLetter, { color: colors.blue }, fontStyle('bold')]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        {online ? (
          <View
            style={[
              styles.onlineDot,
              {
                backgroundColor: '#22c55e',
                borderColor: onlineBorder,
              },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.center}>
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            { color: colors.heading },
            unread ? fontStyle('bold') : fontStyle('semibold'),
          ]}
        >
          {name}
        </Text>

        <View style={styles.previewRow}>
          {preview.showSentChecks ? (
            <Ionicons
              name="checkmark-done"
              size={16}
              color={checkColor}
              style={styles.checkIcon}
            />
          ) : null}
          {preview.icon ? (
            <Ionicons
              name={preview.icon}
              size={15}
              color={previewColor}
              style={styles.previewIcon}
            />
          ) : null}
          <Text
            numberOfLines={1}
            style={[
              styles.preview,
              { color: previewColor },
              unread ? fontStyle('medium') : fontStyle('regular'),
            ]}
          >
            {preview.text}
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        <Text
          style={[
            styles.time,
            {
              color: unread ? colors.blue : colors.muted,
            },
            fontStyle('medium'),
          ]}
        >
          {time}
        </Text>
        {unread ? (
          <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
            <Text style={[styles.badgeText, fontStyle('bold')]}>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Text>
          </View>
        ) : (
          <View style={styles.badgeSpacer} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 76,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    flexShrink: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 22 },
  onlineDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  center: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 5,
    paddingRight: 4,
  },
  name: {
    fontSize: 16,
    lineHeight: 21,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  checkIcon: {
    marginRight: 4,
  },
  previewIcon: {
    marginRight: 4,
  },
  preview: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  meta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 2,
    minWidth: 48,
    gap: 8,
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSpacer: {
    height: 22,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
  },
});
