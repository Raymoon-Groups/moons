import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { Profile } from '@/lib/types';

type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

export function ProfilePhotoUpload({
  profile,
  displayName,
  saving,
  onPick,
  onRemove,
  onSave,
  onError,
}: {
  profile: Profile;
  displayName: string;
  saving: boolean;
  onPick: (file: PickedImage | null, remove: boolean) => void;
  onRemove: () => void;
  onSave: () => void;
  onError: (message: string) => void;
}) {
  const { colors } = useTheme();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  const savedUrl = profile.avatarUrl
    ? `${resolveAssetUrl(profile.avatarUrl)}?v=${new Date(profile.updatedAt).getTime()}`
    : null;
  const displayUrl = previewUri ?? (pendingRemove ? null : savedUrl);
  const letter = (displayName.trim().charAt(0) || 'U').toUpperCase();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
        avatar: {
          width: 88,
          height: 88,
          borderRadius: 44,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        letter: { fontSize: 32, color: '#fff', ...fontStyle('bold') },
        info: { flex: 1 },
        title: { fontSize: 16, color: colors.heading, ...fontStyle('bold') },
        hint: { marginTop: 4, fontSize: 12, color: colors.muted, lineHeight: 18, ...fontStyle('regular') },
        actions: { marginTop: 10, gap: 8 },
        removeText: { fontSize: 13, color: colors.error, ...fontStyle('semibold') },
        pendingNote: { marginTop: 8, fontSize: 12, color: colors.warning, ...fontStyle('regular') },
      }),
    [colors],
  );

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onError('Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      onError('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
      onError('Image must be 2 MB or smaller');
      return;
    }

    onError('');
    setPreviewUri(asset.uri);
    setPendingRemove(false);
    setHasPending(true);
    onPick(
      {
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        type: mime,
      },
      false,
    );
  }

  function handleRemove() {
    setPreviewUri(null);
    setPendingRemove(true);
    setHasPending(true);
    onPick(null, true);
    onRemove();
    onError('');
  }

  function handleUndoRemove() {
    setPendingRemove(false);
    setHasPending(false);
    onPick(null, false);
    onError('');
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {displayUrl ? (
            <Image source={{ uri: displayUrl }} style={{ width: 88, height: 88 }} contentFit="cover" />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.blue,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={styles.letter}>{letter}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Profile photo</Text>
          <Text style={styles.hint}>JPG, PNG or WEBP · max 2 MB</Text>
          <View style={styles.actions}>
            <SecondaryButton label="Upload photo" onPress={pickImage} />
            {(savedUrl || previewUri) && !pendingRemove ? (
              <Pressable onPress={handleRemove} disabled={saving}>
                <Text style={styles.removeText}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      {hasPending && !pendingRemove ? (
        <PrimaryButton label={saving ? 'Saving…' : 'Save photo'} onPress={onSave} loading={saving} />
      ) : null}
      {pendingRemove ? (
        <View>
          <Text style={styles.pendingNote}>Photo will be removed when you save.</Text>
          <PrimaryButton label={saving ? 'Saving…' : 'Confirm remove'} onPress={onSave} loading={saving} />
          <SecondaryButton label="Undo" onPress={handleUndoRemove} />
        </View>
      ) : null}
    </View>
  );
}

export function CompanyLogoUpload({
  profile,
  companyName,
  saving,
  onPick,
  onRemove,
  onSave,
  onError,
}: {
  profile: Profile;
  companyName: string;
  saving: boolean;
  onPick: (file: PickedImage | null, remove: boolean) => void;
  onRemove: () => void;
  onSave: () => void;
  onError: (message: string) => void;
}) {
  const { colors } = useTheme();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  const savedUrl = profile.companyLogoUrl
    ? `${resolveAssetUrl(profile.companyLogoUrl)}?v=${new Date(profile.updatedAt).getTime()}`
    : null;
  const displayUrl = previewUri ?? (pendingRemove ? null : savedUrl);
  const letter = (companyName.trim().charAt(0) || 'C').toUpperCase();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
        logo: {
          width: 72,
          height: 72,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        letter: { fontSize: 28, color: colors.blue, ...fontStyle('bold') },
        title: { fontSize: 16, color: colors.heading, ...fontStyle('bold') },
        hint: { marginTop: 4, fontSize: 12, color: colors.muted, ...fontStyle('regular') },
        actions: { marginTop: 10, gap: 8 },
        removeText: { fontSize: 13, color: colors.error, ...fontStyle('semibold') },
        pendingNote: { marginTop: 8, fontSize: 12, color: colors.warning, ...fontStyle('regular') },
      }),
    [colors],
  );

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onError('Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      onError('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
      onError('Image must be 2 MB or smaller');
      return;
    }

    onError('');
    setPreviewUri(asset.uri);
    setPendingRemove(false);
    setHasPending(true);
    onPick(
      {
        uri: asset.uri,
        name: asset.fileName ?? 'logo.jpg',
        type: mime,
      },
      false,
    );
  }

  function handleRemove() {
    setPreviewUri(null);
    setPendingRemove(true);
    setHasPending(true);
    onPick(null, true);
    onRemove();
    onError('');
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.logo}>
          {displayUrl ? (
            <Image source={{ uri: displayUrl }} style={{ width: 72, height: 72 }} contentFit="cover" />
          ) : (
            <Text style={styles.letter}>{letter}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Company logo</Text>
          <Text style={styles.hint}>JPG, PNG or WEBP · max 2 MB</Text>
          <View style={styles.actions}>
            <SecondaryButton label="Upload logo" onPress={pickImage} />
            {(savedUrl || previewUri) && !pendingRemove ? (
              <Pressable onPress={handleRemove} disabled={saving}>
                <Text style={styles.removeText}>Remove logo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      {hasPending && !pendingRemove ? (
        <PrimaryButton label={saving ? 'Saving…' : 'Save logo'} onPress={onSave} loading={saving} />
      ) : null}
      {pendingRemove ? (
        <View>
          <Text style={styles.pendingNote}>Logo will be removed when you save.</Text>
          <PrimaryButton label={saving ? 'Saving…' : 'Confirm remove'} onPress={onSave} loading={saving} />
        </View>
      ) : null}
    </View>
  );
}

export type { PickedImage };
