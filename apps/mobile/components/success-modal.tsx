import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type SuccessModalVariant = 'success' | 'info' | 'neutral';

export function SuccessModal({
  visible,
  onClose,
  title = 'Success',
  message,
  primaryLabel = 'Got it',
  secondaryLabel,
  onSecondary,
  variant = 'success',
  icon,
  eyebrow = 'MoonsJob',
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  variant?: SuccessModalVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  eyebrow?: string | null;
}) {
  const { colors, isDark } = useTheme();

  const tone =
    variant === 'neutral'
      ? {
          icon: icon ?? ('person-remove-outline' as const),
          iconBg: isDark ? `${colors.blue}22` : `${colors.blue}12`,
          iconColor: colors.blue,
          ring: isDark ? `${colors.blue}33` : `${colors.blue}22`,
        }
      : variant === 'info'
        ? {
            icon: icon ?? ('information-circle-outline' as const),
            iconBg: isDark ? colors.infoBg : colors.infoBg,
            iconColor: colors.info,
            ring: isDark ? `${colors.info}33` : `${colors.info}22`,
          }
        : {
            icon: icon ?? ('checkmark' as const),
            iconBg: isDark ? `${colors.blue}28` : `${colors.blue}14`,
            iconColor: colors.blue,
            ring: isDark ? `${colors.blue}40` : `${colors.blue}24`,
          };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
          <View style={[styles.accent, { backgroundColor: colors.blue }]} />

          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: colors.blue }, fontStyle('semibold')]}>{eyebrow}</Text>
          ) : null}

          <View style={[styles.iconRing, { borderColor: tone.ring }]}>
            <View style={[styles.iconCircle, { backgroundColor: tone.iconBg }]}>
              <Ionicons name={tone.icon} size={28} color={tone.iconColor} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]}>{title}</Text>
          <Text style={[styles.message, { color: colors.muted }, fontStyle('regular')]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.primaryBtn, { backgroundColor: colors.blue }]}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryText, fontStyle('bold')]}>{primaryLabel}</Text>
            </Pressable>

            {secondaryLabel && onSecondary ? (
              <Pressable
                onPress={() => {
                  onClose();
                  onSecondary();
                }}
                style={[
                  styles.secondaryBtn,
                  {
                    borderColor: isDark ? colors.border : `${colors.blue}33`,
                    backgroundColor: isDark ? colors.surface : `${colors.blue}08`,
                  },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.secondaryText, { color: colors.blue }, fontStyle('semibold')]}>
                  {secondaryLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 28, 51, 0.52)',
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
