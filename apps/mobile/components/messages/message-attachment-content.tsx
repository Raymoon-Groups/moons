import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AttachmentViewerModal } from '@/components/messages/attachment-viewer-modal';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export function MessageAttachmentContent({
  url,
  fileName,
  mimeType,
  isMine,
}: {
  url: string;
  fileName: string;
  mimeType?: string | null;
  isMine?: boolean;
}) {
  const { colors } = useTheme();
  const [viewerOpen, setViewerOpen] = useState(false);
  const href = resolveAssetUrl(url) ?? url;
  const isImage = mimeType?.startsWith('image/');

  return (
    <>
      {isImage ? (
        <Pressable onPress={() => setViewerOpen(true)} style={styles.imageWrap}>
          <Image source={{ uri: href }} style={styles.image} contentFit="cover" />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => setViewerOpen(true)}
          style={[
            styles.fileChip,
            isMine
              ? { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)' }
              : { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Ionicons name="download-outline" size={16} color={isMine ? '#fff' : colors.blue} />
          <Text
            numberOfLines={1}
            style={[
              styles.fileName,
              { color: isMine ? '#fff' : colors.heading },
              fontStyle('semibold'),
            ]}
          >
            {fileName}
          </Text>
          <Ionicons name="arrow-down-circle-outline" size={18} color={isMine ? 'rgba(255,255,255,0.9)' : colors.blue} />
        </Pressable>
      )}

      <AttachmentViewerModal
        visible={viewerOpen}
        url={url}
        fileName={fileName}
        mimeType={mimeType}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  imageWrap: { marginTop: 6, borderRadius: 16, overflow: 'hidden' },
  image: { width: 220, height: 168, borderRadius: 16 },
  fileChip: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  fileName: { flex: 1, fontSize: 12 },
});
