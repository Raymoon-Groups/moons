import { Modal, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function UploadProgressModal({
  visible,
  progress,
  label,
}: {
  visible: boolean;
  progress: number;
  label: string;
}) {
  const { colors, isDark } = useTheme();
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <Modal visible={visible} transparent animationType="fade">
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
          <Text style={[styles.eyebrow, { color: colors.blue }, fontStyle('semibold')]}>MoonsJob</Text>
          <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]}>{label}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }, fontStyle('regular')]}>
            Please wait while we finish uploading.
          </Text>

          <View style={[styles.track, { backgroundColor: isDark ? colors.surface : `${colors.blue}10` }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${clamped}%`,
                  backgroundColor: colors.blue,
                },
              ]}
            />
          </View>
          <Text style={[styles.percent, { color: colors.heading }, fontStyle('semibold')]}>{clamped}%</Text>
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
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 22,
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
  title: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  percent: {
    marginTop: 10,
    fontSize: 14,
  },
});
