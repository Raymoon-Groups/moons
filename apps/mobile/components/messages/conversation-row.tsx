import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const preview = previewText(conversation);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: `${colors.blue}14`, borderless: false }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: unread ? `${colors.blue}40` : colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      {unread ? <View style={[styles.unreadStripe, { backgroundColor: colors.blue }]} /> : null}

      <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImg} contentFit="cover" />
        ) : (
          <Text style={[styles.avatarLetter, { color: colors.blue }, fontStyle('bold')]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        )}
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
            <Text
              style={[
                styles.time,
                { color: unread ? colors.blue : colors.muted },
                fontStyle('medium'),
              ]}
            >
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
            { color: unread ? colors.foreground : colors.muted },
            unread ? fontStyle('semibold') : fontStyle('regular'),
          ]}
        >
          {preview}
        </Text>
      </View>

      <View style={styles.trailing}>
        {unread ? (
          conversation.unreadCount > 1 ? (
            <View style={[styles.badge, { backgroundColor: colors.blue }]}>
              <Text style={[styles.badgeText, fontStyle('bold')]}>{conversation.unreadCount}</Text>
            </View>
          ) : (
            <View style={[styles.unreadDot, { backgroundColor: colors.blue }]} />
          )
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ opacity: 0.45 }} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? theme.shadow.soft : { elevation: 0 }),
  },
  pressed: {
    opacity: 0.96,
  },
  unreadStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 18 },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    flexShrink: 0,
  },
  headline: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    ...fontStyle('regular'),
  },
  preview: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
  },
  trailing: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
  },
});
