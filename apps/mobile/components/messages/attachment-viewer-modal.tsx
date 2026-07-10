import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function AttachmentViewerModal({
  visible,
  url,
  fileName,
  mimeType,
  onClose,
}: {
  visible: boolean;
  url: string;
  fileName: string;
  mimeType?: string | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const href = resolveAssetUrl(url) ?? url;
  const isImage = mimeType?.startsWith('image/');

  async function openExternally() {
    try {
      await Linking.openURL(href);
    } catch {
      // ignore
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close preview" />

        <View style={[styles.toolbar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.body}>
          {isImage ? (
            <Image source={{ uri: href }} style={styles.fullImage} contentFit="contain" />
          ) : (
            <View style={[styles.fileCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={[styles.fileIcon, { backgroundColor: `${colors.blue}14` }]}>
                <Ionicons name="document-text-outline" size={34} color={colors.blue} />
              </View>
              <Text style={[{ color: colors.heading, fontSize: 16, textAlign: 'center' }, fontStyle('bold')]}>
                {fileName}
              </Text>
              <Text style={[{ color: colors.muted, fontSize: 13, marginTop: 8, textAlign: 'center' }, fontStyle('regular')]}>
                Tap below to open this file on your device.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text numberOfLines={2} style={[styles.fileName, fontStyle('medium')]}>
            {fileName}
          </Text>
          <Pressable
            onPress={() => void openExternally()}
            style={[styles.openBtn, { backgroundColor: colors.blue }]}
          >
            <Ionicons name="open-outline" size={18} color="#fff" />
            <Text style={[{ color: '#fff', fontSize: 15 }, fontStyle('semibold')]}>Open file</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(10, 15, 28, 0.92)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    maxHeight: 520,
  },
  fileCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  fileIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  fileName: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    textAlign: 'center',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 14,
  },
});
