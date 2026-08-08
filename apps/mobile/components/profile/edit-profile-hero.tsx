import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ViewableAvatar } from '@/components/profile/protected-avatar-viewer';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function EditProfileHero({
  displayName,
  handle,
  imageUrl,
  onPressCamera,
}: {
  displayName: string;
  handle: string;
  imageUrl?: string | null;
  onPressCamera: () => void;
}) {
  const { colors, isDark } = useTheme();
  const letter = (displayName.trim().charAt(0) || 'U').toUpperCase();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderColor: isDark ? colors.border : 'transparent',
        },
        theme.shadow.soft,
      ]}
    >
      <View style={styles.avatarWrap}>
        <ViewableAvatar uri={imageUrl} name={displayName}>
          <View style={[styles.avatar, { backgroundColor: isDark ? colors.surface : '#E8F0FE' }]}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={[{ fontSize: 36, color: colors.blue }, fontStyle('bold')]}>{letter}</Text>
            )}
          </View>
        </ViewableAvatar>
        <Pressable
          onPress={onPressCamera}
          style={[styles.cameraBtn, { backgroundColor: colors.heading }]}
          accessibilityLabel="Change profile photo"
        >
          <Ionicons name="camera" size={14} color="#fff" />
        </Pressable>
      </View>

      <Text style={[styles.name, { color: colors.heading }, fontStyle('bold')]} numberOfLines={1}>
        {displayName}
      </Text>
      <Text style={[styles.handle, { color: colors.muted }, fontStyle('medium')]} numberOfLines={1}>
        {handle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    width: 104,
    height: 104,
    marginBottom: 14,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  cameraBtn: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  handle: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
});
