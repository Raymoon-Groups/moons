import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

/**
 * Professional confirm dialog (same visual language as SuccessModal).
 * Used for delete / destructive actions instead of system Alert.alert.
 */
export function ConfirmModal({
  visible,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  destructive = true,
  icon,
  eyebrow = 'MoonsJob',
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  eyebrow?: string | null;
}) {
  const { colors, isDark } = useTheme();
  const accent = destructive ? colors.error : colors.blue;
  const iconName = icon ?? (destructive ? 'trash-outline' : 'help-circle-outline');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
              borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
            },
          ]}
        >
          <View style={[styles.accent, { backgroundColor: accent }]} />

          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: colors.blue }, fontStyle('semibold')]}>
              {eyebrow}
            </Text>
          ) : null}

          <View
            style={[
              styles.iconRing,
              { borderColor: destructive ? `${colors.error}33` : `${colors.blue}28` },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: destructive
                    ? isDark
                      ? colors.errorBg
                      : 'rgba(220, 38, 38, 0.1)'
                    : isDark
                      ? `${colors.blue}28`
                      : `${colors.blue}14`,
                },
              ]}
            >
              <Ionicons name={iconName} size={28} color={accent} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]}>{title}</Text>
          <Text style={[styles.message, { color: colors.muted }, fontStyle('regular')]}>
            {message}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={[
                styles.primaryBtn,
                { backgroundColor: accent, opacity: loading ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.primaryText, fontStyle('bold')]}>{confirmLabel}</Text>
              )}
            </Pressable>

            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={[
                styles.secondaryBtn,
                {
                  borderColor: isDark ? colors.border : `${colors.blue}33`,
                  backgroundColor: isDark ? colors.surface : `${colors.blue}08`,
                },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryText, { color: colors.heading }, fontStyle('semibold')]}>
                {cancelLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 38, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 352,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
  },
  secondaryBtn: {
    width: '100%',
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryText: {
    fontSize: 14,
  },
});
