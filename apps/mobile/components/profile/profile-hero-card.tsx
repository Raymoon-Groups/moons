import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CoverPhotoBanner } from '@/components/network/cover-photo-banner';
import { ViewableAvatar } from '@/components/profile/protected-avatar-viewer';
import { resolveAvatarUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function ProfileHeroCard({
  name,
  title,
  location,
  avatarUrl,
  bannerUrl,
  bannerUpdatedAt,
  completionPercent,
  editable = true,
  onEdit,
  onBannerUpdated,
}: {
  name: string;
  title?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bannerUpdatedAt?: string | null;
  completionPercent?: number | null;
  editable?: boolean;
  onEdit?: () => void;
  onBannerUpdated?: (bannerUrl: string | null, updatedAt: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const uri = resolveAvatarUrl(avatarUrl);
  const percent = Math.max(0, Math.min(100, completionPercent ?? 0));
  const goEdit = onEdit ?? (() => router.push('/profile/edit'));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderColor: isDark ? colors.border : 'transparent',
        },
        theme.shadow.card,
      ]}
    >
      <View style={styles.coverWrap}>
        <CoverPhotoBanner
          bannerUrl={bannerUrl ?? null}
          updatedAt={bannerUpdatedAt}
          editable={editable}
          onUpdated={onBannerUpdated}
        />
        {!bannerUrl && !editable ? (
          <LinearGradient
            colors={isDark ? [colors.surface, colors.surfaceElevated] : ['#E8F0FE', '#D7EBDF']}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.avatarBlock}>
            <ViewableAvatar uri={uri} name={name}>
              <View
                style={[
                  styles.avatarRing,
                  {
                    borderColor: isDark ? colors.surfaceElevated : '#fff',
                    backgroundColor: isDark ? colors.surface : '#E8F0FE',
                  },
                ]}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.avatarImg} contentFit="cover" />
                ) : (
                  <Text style={[{ fontSize: 28, color: colors.blue }, fontStyle('bold')]}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </ViewableAvatar>
            {percent > 0 ? (
              <View
                style={[
                  styles.percentBadge,
                  {
                    backgroundColor: colors.blue,
                    borderColor: isDark ? colors.surfaceElevated : '#fff',
                  },
                ]}
              >
                <Text style={[styles.percentText, fontStyle('bold')]}>{percent}%</Text>
              </View>
            ) : null}
          </View>

          {editable ? (
            <Pressable
              onPress={goEdit}
              style={[styles.editBtn, { backgroundColor: isDark ? colors.surface : '#F3F4F6' }]}
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="pencil" size={15} color={colors.blue} />
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.name, { color: colors.heading }, fontStyle('extrabold')]} numberOfLines={2}>
          {name}
        </Text>
        {title ? (
          <Text style={[styles.title, { color: colors.muted }, fontStyle('medium')]} numberOfLines={2}>
            {title}
          </Text>
        ) : (
          <Text style={[styles.title, { color: colors.muted }, fontStyle('medium')]}>
            Add a headline to stand out
          </Text>
        )}

        {location ? (
          <View style={[styles.locationPill, { backgroundColor: isDark ? `${colors.blue}22` : '#F0F5FF' }]}>
            <Ionicons name="location" size={13} color={colors.blue} />
            <Text
              style={[styles.locationText, { color: colors.heading }, fontStyle('semibold')]}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
        ) : editable ? (
          <Pressable
            onPress={goEdit}
            style={[styles.locationPill, { backgroundColor: isDark ? colors.surface : '#F0F5FF' }]}
          >
            <Ionicons name="add-circle-outline" size={14} color={colors.blue} />
            <Text style={[styles.locationText, { color: colors.blue }, fontStyle('semibold')]}>
              Add location
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  coverWrap: {
    position: 'relative',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -42,
    marginBottom: 12,
  },
  avatarBlock: {
    width: 92,
    height: 92,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  percentBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    minWidth: 34,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  percentText: { color: '#fff', fontSize: 10 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
  },
  title: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  locationPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  locationText: {
    fontSize: 12,
    maxWidth: 180,
  },
});
