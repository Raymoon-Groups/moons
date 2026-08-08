import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

type Option = {
  key: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

export function PostOptionsSheet({
  visible,
  isMine,
  onClose,
  onShare,
  onWhatsApp,
  onSendToConnection,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  isMine: boolean;
  onClose: () => void;
  onShare: () => void;
  onWhatsApp: () => void;
  onSendToConnection: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { colors, isDark } = useTheme();

  const options = useMemo(() => {
    const items: Option[] = [
      {
        key: 'share',
        label: 'Share post',
        subtitle: 'Open the system share sheet',
        icon: 'share-outline',
        onPress: onShare,
      },
      {
        key: 'whatsapp',
        label: 'Share on WhatsApp',
        subtitle: 'Send a link via WhatsApp',
        icon: 'logo-whatsapp',
        onPress: onWhatsApp,
      },
      {
        key: 'connection',
        label: 'Send to MoonsJob connection',
        subtitle: 'Forward as a message',
        icon: 'people-outline',
        onPress: onSendToConnection,
      },
    ];
    if (isMine && onEdit) {
      items.push({
        key: 'edit',
        label: 'Edit post',
        icon: 'create-outline',
        onPress: onEdit,
      });
    }
    if (isMine && onDelete) {
      items.push({
        key: 'delete',
        label: 'Delete post',
        icon: 'trash-outline',
        destructive: true,
        onPress: onDelete,
      });
    }
    return items;
  }, [isMine, onDelete, onEdit, onSendToConnection, onShare, onWhatsApp]);

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
        label: {
          fontSize: 15,
          ...fontStyle('semibold'),
        },
        subtitle: {
          fontSize: 12,
          marginTop: 2,
          color: colors.muted,
        },
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
      }),
    [colors, isDark],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Post options</Text>
          {options.map((item) => {
            const tint = item.destructive ? colors.error : colors.blue;
            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
                onPress={() => {
                  onClose();
                  // let sheet close before firing action overlays
                  setTimeout(item.onPress, 180);
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${tint}16` }]}>
                  <Ionicons name={item.icon} size={20} color={tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: item.destructive ? colors.error : colors.heading }]}>
                    {item.label}
                  </Text>
                  {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            );
          })}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
