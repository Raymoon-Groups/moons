import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

type CommentOption = {
  key: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

export function CommentOptionsSheet({
  visible,
  options,
  onClose,
}: {
  visible: boolean;
  options: CommentOption[];
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#F7F9FC',
              borderColor: colors.border,
              borderWidth: isDark ? 1 : 0,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[{ color: colors.heading, fontSize: 17, paddingHorizontal: 8, marginBottom: 8 }, fontStyle('bold')]}>
            Comment options
          </Text>

          {options.map((item) => {
            const tint = item.destructive ? colors.error : colors.blue;
            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: colors.border,
                    borderWidth: isDark ? 1 : 0,
                  },
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(item.onPress, 180);
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${tint}16` }]}>
                  <Ionicons name={item.icon} size={20} color={tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.label,
                      { color: item.destructive ? colors.error : colors.heading },
                      fontStyle('semibold'),
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.subtitle ? (
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            );
          })}

          <Pressable
            style={[
              styles.cancel,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
            onPress={onClose}
          >
            <Text style={[{ color: colors.heading, fontSize: 15 }, fontStyle('semibold')]}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 38, 0.48)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 8,
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
  },
  cancel: {
    marginTop: 4,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
