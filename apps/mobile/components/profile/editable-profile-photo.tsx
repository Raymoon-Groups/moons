import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ConfirmModal } from '@/components/confirm-modal';
import { ImageCropModal } from '@/components/image-crop-modal';
import { ProtectedPhotoViewer } from '@/components/profile/protected-avatar-viewer';
import { ApiError, authDelete, authUpload } from '@/lib/api';
import { ensurePhotoLibraryAccess } from '@/lib/image-picker-access';
import { fontStyle } from '@/lib/font-style';
import { appendUploadFile } from '@/lib/upload-file';
import { useTheme } from '@/lib/theme-context';
import type { Profile } from '@/lib/types';

type PhotoKind = 'avatar' | 'logo';

const ENDPOINTS: Record<PhotoKind, { upload: string; remove: string; field: string }> = {
  avatar: { upload: '/profiles/me/avatar', remove: '/profiles/me/avatar', field: 'avatar' },
  logo: {
    upload: '/profiles/me/company-logo',
    remove: '/profiles/me/company-logo',
    field: 'logo',
  },
};

/**
 * Tap the profile photo → View / Update / Remove.
 * Handles pick → crop → upload (and delete) for avatar or company logo.
 */
export function EditableProfilePhoto({
  uri,
  name,
  kind = 'avatar',
  editable = true,
  children,
  style,
  onUpdated,
}: {
  uri?: string | null;
  name?: string | null;
  kind?: PhotoKind;
  editable?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onUpdated?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cropUri, setCropUri] = useState<string | null>(null);

  const hasPhoto = Boolean(uri);
  const label = kind === 'logo' ? 'Company logo' : 'Profile photo';
  const endpoints = ENDPOINTS[kind];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(15, 23, 38, 0.48)',
          justifyContent: 'flex-end',
        },
        sheet: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          paddingTop: 10,
          paddingBottom: 28,
          paddingHorizontal: 12,
          backgroundColor: isDark ? colors.surfaceElevated : '#F7F9FC',
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginBottom: 12,
        },
        title: {
          color: colors.heading,
          fontSize: 17,
          paddingHorizontal: 8,
          marginBottom: 8,
          ...fontStyle('bold'),
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 12,
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          marginBottom: 8,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        },
        iconWrap: {
          width: 42,
          height: 42,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rowLabel: { fontSize: 15, ...fontStyle('semibold') },
        rowSub: { fontSize: 12, marginTop: 2, color: colors.muted },
        cancel: {
          marginTop: 4,
          height: 48,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        },
        cancelText: {
          color: colors.heading,
          fontSize: 15,
          ...fontStyle('semibold'),
        },
        busyOverlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15,23,38,0.35)',
          borderRadius: 999,
          zIndex: 2,
        },
      }),
    [colors, isDark],
  );

  async function pickAndCrop() {
    const access = await ensurePhotoLibraryAccess();
    if (!access.ok) {
      Alert.alert('Permission needed', access.message);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      Alert.alert('Invalid file', 'Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) {
      Alert.alert('File too large', 'Image must be 8 MB or smaller before cropping.');
      return;
    }
    setCropUri(asset.uri);
  }

  async function uploadCropped(nextUri: string) {
    setCropUri(null);
    setBusy(true);
    try {
      const formData = new FormData();
      await appendUploadFile(formData, endpoints.field, {
        uri: nextUri,
        name: kind === 'logo' ? 'logo.jpg' : 'avatar.jpg',
        type: 'image/jpeg',
      });
      await authUpload<Profile>(endpoints.upload, formData);
      onUpdated?.();
    } catch (err) {
      Alert.alert(
        'Upload failed',
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Try again',
      );
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setConfirmRemove(false);
    setBusy(true);
    try {
      await authDelete<Profile>(endpoints.remove);
      onUpdated?.();
    } catch (err) {
      Alert.alert(
        'Remove failed',
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Try again',
      );
    } finally {
      setBusy(false);
    }
  }

  function openMenu() {
    if (!editable) {
      if (hasPhoto) setViewerOpen(true);
      return;
    }
    setMenuOpen(true);
  }

  const options = [
    ...(hasPhoto
      ? [
          {
            key: 'view',
            label: 'View profile pic',
            subtitle: `Open full-size ${kind === 'logo' ? 'logo' : 'photo'}`,
            icon: 'eye-outline' as const,
            onPress: () => setViewerOpen(true),
          },
        ]
      : []),
    {
      key: 'update',
      label: hasPhoto ? 'Update' : 'Add photo',
      subtitle: hasPhoto ? 'Choose a new photo' : 'Upload a profile photo',
      icon: 'camera-outline' as const,
      onPress: () => void pickAndCrop(),
    },
    ...(hasPhoto
      ? [
          {
            key: 'remove',
            label: 'Remove',
            subtitle: `Delete this ${kind === 'logo' ? 'logo' : 'photo'}`,
            icon: 'trash-outline' as const,
            destructive: true,
            onPress: () => setConfirmRemove(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <Pressable
        onPress={openMenu}
        style={[{ position: 'relative', overflow: 'hidden' }, style]}
        disabled={busy}
        accessibilityRole="imagebutton"
        accessibilityLabel={`${label} options`}
      >
        {children}
        {busy ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>{label}</Text>
            {options.map((item) => {
              const tint = item.destructive ? colors.error : colors.blue;
              return (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
                  onPress={() => {
                    setMenuOpen(false);
                    setTimeout(item.onPress, 180);
                  }}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${tint}16` }]}>
                    <Ionicons name={item.icon} size={20} color={tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: item.destructive ? colors.error : colors.heading },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? <Text style={styles.rowSub}>{item.subtitle}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              );
            })}
            <Pressable style={styles.cancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {uri ? (
        <ProtectedPhotoViewer
          visible={viewerOpen}
          uri={uri}
          name={name}
          variant="avatar"
          onClose={() => setViewerOpen(false)}
        />
      ) : null}

      <ConfirmModal
        visible={confirmRemove}
        title={`Remove ${kind === 'logo' ? 'logo' : 'photo'}?`}
        message={
          kind === 'logo'
            ? 'Your company logo will be removed from your profile.'
            : 'Your profile photo will be removed from your profile.'
        }
        confirmLabel="Remove"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => void removePhoto()}
        loading={busy}
        destructive
      />

      <ImageCropModal
        visible={!!cropUri}
        uri={cropUri}
        aspect={kind === 'logo' ? 'logo' : 'avatar'}
        onCancel={() => setCropUri(null)}
        onComplete={(result) => void uploadCropped(result.uri)}
      />
    </>
  );
}
