import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ConversationPreview } from '@/lib/messages';
import { truncateMessagePreview } from '@/lib/messages';
import { formatConversationTime } from '@/lib/message-format';
import { resolveAvatarUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function previewText(conversation: ConversationPreview) {
  if (!conversation.lastMessage) return 'No messages yet';
  const prefix = conversation.lastMessage.isMine ? 'You: ' : '';
  return `${prefix}${truncateMessagePreview(conversation.lastMessage.body, 72)}`;
}

export function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationPreview;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const person = conversation.otherUser;
  const avatar = resolveAvatarUrl(person.avatarUrl);
  const name = person.fullName?.trim() || 'Professional';
  const unread = conversation.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: unread ? `${colors.blue}0C` : colors.surfaceElevated,
          borderColor: unread ? `${colors.blue}44` : colors.border,
        },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={[fontStyle('bold'), { color: colors.heading, fontSize: 16 }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        {unread ? <View style={[styles.unreadDot, { backgroundColor: colors.blue, borderColor: colors.surfaceElevated }]} /> : null}
      </View>

      <View style={styles.copy}>
        <View style={styles.topRow}>
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
          {conversation.lastMessage ? (
            <Text style={[styles.time, { color: colors.muted }]}>
              {formatConversationTime(conversation.lastMessage.createdAt)}
            </Text>
          ) : null}
        </View>
        {person.headline ? (
          <Text numberOfLines={1} style={[styles.headline, { color: colors.muted }]}>
            {person.headline}
          </Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={[
            styles.preview,
            { color: unread ? colors.heading : colors.muted },
            unread ? fontStyle('medium') : fontStyle('regular'),
          ]}
        >
          {previewText(conversation)}
        </Text>
      </View>

      {unread && conversation.unreadCount > 1 ? (
        <View style={[styles.badge, { backgroundColor: colors.blue }]}>
          <Text style={[styles.badgeText, fontStyle('bold')]}>{conversation.unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    ...theme.shadow.soft,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  unreadDot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  copy: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 15 },
  time: { fontSize: 11, ...fontStyle('medium') },
  headline: { marginTop: 2, fontSize: 11, lineHeight: 15 },
  preview: { marginTop: 4, fontSize: 13, lineHeight: 18 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeText: { color: '#fff', fontSize: 11 },
});
