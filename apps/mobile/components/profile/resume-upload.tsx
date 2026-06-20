import * as DocumentPicker from 'expo-document-picker';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export type PickedResume = {
  uri: string;
  name: string;
  type: string;
};

export function ResumeUpload({
  profile,
  pendingFile,
  pendingRemove,
  saving,
  onPick,
  onRemove,
  onSave,
  onError,
}: {
  profile: Profile;
  pendingFile: PickedResume | null;
  pendingRemove: boolean;
  saving: boolean;
  onPick: (file: PickedResume | null) => void;
  onRemove: () => void;
  onSave: () => void;
  onError: (message: string) => void;
}) {
  const { colors } = useTheme();

  const fileName = pendingRemove
    ? null
    : pendingFile?.name ?? profile.resumeFileName ?? null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fileName: {
          fontSize: 14,
          color: colors.foreground,
          marginBottom: theme.spacing.sm,
          ...fontStyle('medium'),
        },
        empty: { fontSize: 14, color: colors.muted, marginBottom: theme.spacing.sm, ...fontStyle('regular') },
        hint: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 18, ...fontStyle('regular') },
        removeText: { fontSize: 13, color: colors.error, marginTop: 8, ...fontStyle('semibold') },
      }),
    [colors],
  );

  async function pickResume() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'application/pdf';
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(mime)) {
      onError('Resume must be PDF or Word document');
      return;
    }
    if (asset.size && asset.size > 5 * 1024 * 1024) {
      onError('Resume must be 5 MB or smaller');
      return;
    }

    onError('');
    onPick({
      uri: asset.uri,
      name: asset.name,
      type: mime,
    });
  }

  return (
    <View>
      {fileName ? (
        <Text style={styles.fileName}>{fileName}</Text>
      ) : (
        <Text style={styles.empty}>No resume uploaded</Text>
      )}
      <SecondaryButton
        label={fileName ? 'Replace resume' : 'Upload resume (PDF or DOC)'}
        onPress={pickResume}
      />
      {fileName && !pendingRemove ? (
        <Pressable onPress={onRemove} disabled={saving}>
          <Text style={styles.removeText}>Remove resume</Text>
        </Pressable>
      ) : null}
      <Text style={styles.hint}>PDF or Word · max 5 MB</Text>
      {(pendingFile || pendingRemove) && (
        <PrimaryButton
          label={saving ? 'Saving…' : pendingRemove ? 'Confirm remove' : 'Save resume'}
          onPress={onSave}
          loading={saving}
        />
      )}
    </View>
  );
}
