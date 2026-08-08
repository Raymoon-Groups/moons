import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedPhotoViewer } from '@/components/profile/protected-avatar-viewer';
import { authDelete, authUpload } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
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
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [localBanner, setLocalBanner] = useState(bannerUrl);
  const [cacheVersion, setCacheVersion] = useState(updatedAt ?? '');

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
        wrap: { height: 140, backgroundColor: `${colors.blue}22` },
        image: { width: '100%', height: '100%' },
        actions: {
          position: 'absolute',
          right: 12,
          top: 12,
          flexDirection: 'row',
          gap: 8,
          zIndex: 2,
        },
        btn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.surfaceElevated,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: colors.border,
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
    [colors],
  );

  async function pickAndUpload() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 5],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      Alert.alert('Invalid file', 'Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('File too large', 'Cover photo must be 5 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      const name = asset.fileName ?? `banner.${mime.split('/')[1] ?? 'jpg'}`;
      formData.append('banner', {
        uri: asset.uri,
        name,
        type: mime,
      } as unknown as Blob);
      const saved = await authUpload<Profile>('/profiles/me/banner', formData);
      setLocalBanner(saved.bannerUrl ?? null);
      setCacheVersion(saved.updatedAt);
      onUpdated?.(saved.bannerUrl ?? null, saved.updatedAt);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again');
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
            Alert.alert('Remove failed', err instanceof Error ? err.message : 'Try again');
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
      ) : null}
      {editable ? (
        <View style={styles.actions}>
          {displayUrl ? (
            <Pressable onPress={() => void removeBanner()} disabled={uploading} style={styles.btn}>
              <Text style={styles.btnText}>Remove</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => void pickAndUpload()} disabled={uploading} style={styles.btn}>
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
    </View>
  );
}
