import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MessageAttachment } from '@/lib/messages';
import {
  MAX_MESSAGE_ATTACHMENT_LABEL,
  pickMessageDocument,
  pickMessageImage,
  type AttachmentPickError,
} from '@/lib/message-attachments';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

type PickerOption = {
  id: 'image' | 'document';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const OPTIONS: PickerOption[] = [
  {
    id: 'image',
    title: 'Photo library',
    subtitle: `JPG, PNG, GIF, or WEBP · max ${MAX_MESSAGE_ATTACHMENT_LABEL}`,
    icon: 'images-outline',
  },
  {
    id: 'document',
    title: 'Document',
    subtitle: `PDF, Word, or text · max ${MAX_MESSAGE_ATTACHMENT_LABEL}`,
    icon: 'document-text-outline',
  },
];

export function AttachmentPickerModal({
  visible,
  onClose,
  onPicked,
}: {
  visible: boolean;
  onClose: () => void;
  onPicked: (file: MessageAttachment) => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<PickerOption['id'] | null>(null);
  const [error, setError] = useState<AttachmentPickError | null>(null);

  const heroColors = isDark
    ? (['rgba(74, 127, 212, 0.22)', 'rgba(26, 39, 68, 0.95)'] as const)
    : (['rgba(74, 127, 212, 0.14)', 'rgba(255, 255, 255, 1)'] as const);

  function handleClose() {
    if (loading) return;
    setError(null);
    onClose();
  }

  async function handlePick(source: PickerOption['id']) {
    setLoading(source);
    setError(null);
    const result = source === 'image' ? await pickMessageImage() : await pickMessageDocument();
    setLoading(null);

    if (!result) return;
    if ('error' in result) {
      setError(result.error);
      return;
    }

    onPicked(result.file);
    setError(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Close" />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <LinearGradient colors={heroColors} style={[styles.hero, { borderColor: `${colors.blue}33` }]}>
            <View style={[styles.heroIcon, { backgroundColor: `${colors.blue}18` }]}>
              <Ionicons name="attach" size={22} color={colors.blue} />
            </View>
            <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]}>Attach a file</Text>
            <Text style={[styles.subtitle, { color: colors.muted }, fontStyle('regular')]}>
              Share a photo or document with your message. Max size {MAX_MESSAGE_ATTACHMENT_LABEL}.
            </Text>
          </LinearGradient>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: `${colors.error}33` }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <View style={styles.errorCopy}>
                <Text style={[{ color: colors.error, fontSize: 14 }, fontStyle('bold')]}>{error.title}</Text>
                <Text style={[{ color: colors.error, fontSize: 12, marginTop: 2, lineHeight: 17 }, fontStyle('regular')]}>
                  {error.message}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.options}>
            {OPTIONS.map((option) => {
              const busy = loading === option.id;
              return (
                <Pressable
                  key={option.id}
                  disabled={loading != null}
                  onPress={() => void handlePick(option.id)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: loading != null && !busy ? 0.55 : 1,
                    },
                    pressed && { backgroundColor: colors.surfaceHover },
                  ]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: `${colors.blue}14` }]}>
                    {busy ? (
                      <ActivityIndicator color={colors.blue} size="small" />
                    ) : (
                      <Ionicons name={option.icon} size={22} color={colors.blue} />
                    )}
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={[{ color: colors.heading, fontSize: 15 }, fontStyle('semibold')]}>{option.title}</Text>
                    <Text style={[{ color: colors.muted, fontSize: 12, marginTop: 2 }, fontStyle('regular')]}>
                      {option.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={loading != null}
            onPress={handleClose}
            style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Text style={[{ color: colors.heading, fontSize: 15 }, fontStyle('semibold')]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    ...theme.shadow.card,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  hero: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 20, lineHeight: 26 },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: theme.spacing.md,
  },
  errorCopy: { flex: 1 },
  options: { gap: 10, marginBottom: theme.spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 14,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: { flex: 1, minWidth: 0 },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 14,
  },
});
