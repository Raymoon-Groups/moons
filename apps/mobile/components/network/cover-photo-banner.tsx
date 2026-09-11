import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ensurePhotoLibraryAccess } from '@/lib/image-picker-access';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImageCropModal } from '@/components/image-crop-modal';
import { ProtectedPhotoViewer } from '@/components/profile/protected-avatar-viewer';
import { ApiError, authDelete, authUpload } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { appendUploadFile } from '@/lib/upload-file';
import type { Profile } from '@/lib/types';
import { useTheme } from '@/lib/theme-context';

export function CoverPhotoBanner({
  bannerUrl,
  updatedAt,
  editable,
  onUpdated,
}: {
  bannerUrl: string | null;
  updatedAt?: string | null;
  editable: boolean;
  onUpdated?: (bannerUrl: string | null, updatedAt: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [localBanner, setLocalBanner] = useState(bannerUrl);
  const [cacheVersion, setCacheVersion] = useState(updatedAt ?? '');
  const [cropUri, setCropUri] = useState<string | null>(null);

  useEffect(() => {
    setLocalBanner(bannerUrl);
    setCacheVersion(updatedAt ?? '');
  }, [bannerUrl, updatedAt]);

  const displayUrl = localBanner
    ? `${resolveAssetUrl(localBanner)}${cacheVersion ? `?v=${new Date(cacheVersion).getTime()}` : ''}`
    : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          height: 148,
          width: '100%',
          overflow: 'hidden',
          backgroundColor: isDark ? colors.surface : '#C5D0D9',
        },
        image: { width: '100%', height: '100%' },
        placeholder: {
          ...StyleSheet.absoluteFillObject,
        },
        actions: {
          position: 'absolute',
          right: 12,
          top: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          zIndex: 2,
          pointerEvents: 'box-none',
        },
        btn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)' } as object)
            : {
                shadowColor: '#0f172a',
                shadowOpacity: 0.12,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }),
        },
        btnText: { fontSize: 12, color: colors.heading, ...fontStyle('semibold') },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.25)',
          zIndex: 3,
        },
      }),
    [colors, isDark],
  );

  async function pickImage() {
    const access = await ensurePhotoLibraryAccess();
    if (!access.ok) {
      Alert.alert('Permission needed', access.message);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      Alert.alert('Invalid file', 'Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (asset.fileSize && asset.fileSize > 12 * 1024 * 1024) {
      Alert.alert('File too large', 'Cover photo must be 12 MB or smaller before cropping.');
      return;
    }

    setCropUri(asset.uri);
  }

  async function uploadCropped(uri: string) {
    setCropUri(null);
    setUploading(true);
    try {
      const formData = new FormData();
      // Expo web needs a real Blob; native uses { uri, name, type }.
      await appendUploadFile(formData, 'banner', {
        uri,
        name: 'banner.jpg',
        type: 'image/jpeg',
      });
      const saved = await authUpload<Profile>('/profiles/me/banner', formData);
      setLocalBanner(saved.bannerUrl ?? null);
      setCacheVersion(saved.updatedAt);
      onUpdated?.(saved.bannerUrl ?? null, saved.updatedAt);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Try again';
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  }

  async function removeBanner() {
    Alert.alert('Remove cover photo', 'Remove your cover photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setUploading(true);
          try {
            const saved = await authDelete<Profile>('/profiles/me/banner');
            setLocalBanner(null);
            setCacheVersion(saved.updatedAt);
            onUpdated?.(null, saved.updatedAt);
          } catch (err) {
            Alert.alert(
              'Remove failed',
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : 'Try again',
            );
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.wrap}>
      {displayUrl ? (
        <Pressable
          onPress={() => setViewerOpen(true)}
          style={StyleSheet.absoluteFill}
          accessibilityRole="imagebutton"
          accessibilityLabel="View cover photo"
        >
          <Image source={{ uri: displayUrl }} style={styles.image} contentFit="cover" />
        </Pressable>
      ) : (
        <LinearGradient
          colors={
            isDark
              ? [colors.surface, colors.surfaceElevated, colors.surfaceHover]
              : ['#B8C5CF', '#D4DDE3', '#C5D0D9']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.placeholder}
        />
      )}
      {editable ? (
        <View style={styles.actions}>
          {displayUrl ? (
            <Pressable onPress={() => void removeBanner()} disabled={uploading} style={styles.btn}>
              <Text style={styles.btnText}>Remove</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => void pickImage()} disabled={uploading} style={styles.btn}>
            <Ionicons name="camera-outline" size={16} color={colors.heading} />
            <Text style={styles.btnText}>{displayUrl ? 'Change' : 'Add cover'}</Text>
          </Pressable>
        </View>
      ) : null}
      {uploading ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
      {displayUrl ? (
        <ProtectedPhotoViewer
          visible={viewerOpen}
          uri={displayUrl}
          variant="cover"
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
      <ImageCropModal
        visible={!!cropUri}
        uri={cropUri}
        aspect="cover"
        onCancel={() => setCropUri(null)}
        onComplete={(result) => void uploadCropped(result.uri)}
      />
    </View>
  );
}
