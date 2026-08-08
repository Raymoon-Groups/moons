import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ConversationPreview } from '@/lib/messages';
import { resolveAvatarUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

type FavoriteItem = {
  key: string;
  label: string;
  avatarUrl: string | null;
  onPress: () => void;
  isMe?: boolean;
  active?: boolean;
};

function shortLabel(name: string | null | undefined, fallback: string) {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  return trimmed.split(/\s+/)[0] ?? fallback;
}

function FavoriteAvatar({
  label,
  avatarUrl,
  onPress,
  isMe,
  active,
}: {
  label: string;
  avatarUrl: string | null;
  onPress: () => void;
  isMe?: boolean;
  active?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const uri = resolveAvatarUrl(avatarUrl);
  const ring = isMe ? colors.blue : isDark ? colors.border : '#dbe3ef';

  return (
    <Pressable onPress={onPress} style={styles.item} accessibilityLabel={label}>
      <View style={styles.avatarOuter}>
        <View style={[styles.ring, { borderColor: ring }]}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isDark ? colors.surface : `${colors.blue}14` },
            ]}
          >
            {uri ? (
              <Image source={{ uri }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={[styles.letter, { color: colors.blue }, fontStyle('bold')]}>
                {label.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>
        {active ? (
          <View
            style={[
              styles.onlineDot,
              {
                backgroundColor: '#22c55e',
                borderColor: isDark ? colors.surface : '#f3f5f8',
              },
            ]}
          />
        ) : null}
      </View>
      <Text numberOfLines={1} style={[styles.label, { color: colors.muted }, fontStyle('medium')]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InboxFavoritesRow({
  meName,
  meAvatarUrl,
  onPressMe,
  conversations,
  onPressConversation,
}: {
  meName: string | null | undefined;
  meAvatarUrl: string | null | undefined;
  onPressMe: () => void;
  conversations: ConversationPreview[];
  onPressConversation: (conversationId: string) => void;
}) {
  const { colors, isDark } = useTheme();

  const items: FavoriteItem[] = [
    {
      key: 'me',
      label: 'Me',
      avatarUrl: meAvatarUrl ?? null,
      onPress: onPressMe,
      isMe: true,
      active: true,
    },
    ...conversations.slice(0, 12).map((c) => {
      const name = c.otherUser.fullName?.trim() || 'Contact';
      const iso = c.lastMessage?.createdAt || c.updatedAt;
      const mins = iso ? (Date.now() - new Date(iso).getTime()) / 60000 : 999;
      return {
        key: c.id,
        label: shortLabel(name, 'Contact'),
        avatarUrl: c.otherUser.avatarUrl,
        onPress: () => onPressConversation(c.id),
        active: mins >= 0 && mins < 25,
      };
    }),
  ];

  if (items.length <= 1) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? colors.surface : '#f3f5f8',
          borderBottomColor: isDark ? colors.borderSubtle : 'rgba(15,28,51,0.08)',
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((item) => (
          <FavoriteAvatar
            key={item.key}
            label={item.label}
            avatarUrl={item.avatarUrl}
            onPress={item.onPress}
            isMe={item.isMe}
            active={item.active}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    paddingHorizontal: theme.spacing.md,
    gap: 14,
  },
  item: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  avatarOuter: {
    width: 58,
    height: 58,
  },
  ring: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  letter: { fontSize: 18 },
  onlineDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
});
