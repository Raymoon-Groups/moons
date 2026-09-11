import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type UploadMediaKind = 'photo' | 'photos' | 'video' | 'post';

const KIND_ICON: Record<UploadMediaKind, keyof typeof Ionicons.glyphMap> = {
  photo: 'image-outline',
  photos: 'images-outline',
  video: 'videocam-outline',
  post: 'create-outline',
};

export function UploadProgressModal({
  visible,
  progress,
  label,
  detail,
  kind = 'post',
  fileSummary,
}: {
  visible: boolean;
  progress: number;
  label: string;
  detail?: string;
  kind?: UploadMediaKind;
  fileSummary?: string;
}) {
  const { colors, isDark } = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const done = clamped >= 100;
  const stage = done ? 'Done' : clamped >= 92 ? 'Finishing' : clamped >= 12 ? 'Uploading' : 'Preparing';

  const overlay = useSharedValue(0);
  const sheet = useSharedValue(0);
  const bar = useSharedValue(0);
  const pulse = useSharedValue(1);
  const labelFade = useSharedValue(1);
  const percentPop = useSharedValue(1);

  useEffect(() => {
    if (!visible) {
      overlay.value = 0;
      sheet.value = 0;
      bar.value = 0;
      pulse.value = 1;
      return;
    }
    overlay.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    sheet.value = withSpring(1, { damping: 16, stiffness: 160, mass: 0.9 });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [visible, overlay, sheet, pulse]);

  useEffect(() => {
    bar.value = withTiming(clamped / 100, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
    percentPop.value = 0.86;
    percentPop.value = withSpring(1, { damping: 12, stiffness: 220 });
  }, [clamped, bar, percentPop]);

  useEffect(() => {
    labelFade.value = 0;
    labelFade.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [label, stage, labelFade]);

  useEffect(() => {
    if (!done) return;
    pulse.value = withSequence(
      withTiming(0.88, { duration: 120 }),
      withSpring(1.08, { damping: 10, stiffness: 180 }),
      withSpring(1, { damping: 14, stiffness: 160 }),
    );
  }, [done, pulse]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlay.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheet.value,
    transform: [
      { translateY: interpolate(sheet.value, [0, 1], [28, 0]) },
      { scale: interpolate(sheet.value, [0, 1], [0.92, 1]) },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(2, bar.value * 100)}%`,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelFade.value,
    transform: [{ translateY: interpolate(labelFade.value, [0, 1], [8, 0]) }],
  }));

  const percentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: percentPop.value }],
  }));

  const steps = [
    { id: 'Preparing', active: clamped < 12, done: clamped >= 12 },
    { id: 'Uploading', active: clamped >= 12 && clamped < 92, done: clamped >= 92 },
    { id: 'Finishing', active: clamped >= 92, done: clamped >= 100 },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#ffffff',
              borderColor: isDark ? colors.border : 'rgba(15,28,51,0.06)',
            },
          ]}
        >
          <View style={[styles.accent, { backgroundColor: colors.blue }]} />
          <Text style={[styles.eyebrow, { color: colors.blue }, fontStyle('semibold')]}>MoonsJob</Text>

          <Animated.View style={[styles.iconRing, iconStyle, { borderColor: `${colors.blue}33` }]}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: done ? colors.blue : `${colors.blue}16` },
              ]}
            >
              <Ionicons
                name={done ? 'checkmark' : KIND_ICON[kind]}
                size={28}
                color={done ? '#fff' : colors.blue}
              />
            </View>
          </Animated.View>

          <Animated.Text
            style={[styles.title, labelStyle, { color: colors.heading }, fontStyle('bold')]}
          >
            {label}
          </Animated.Text>
          <Animated.Text
            style={[styles.subtitle, labelStyle, { color: colors.muted }, fontStyle('regular')]}
          >
            {detail ?? 'Keep the app open until the upload finishes.'}
          </Animated.Text>
          {fileSummary ? (
            <View style={[styles.chip, { backgroundColor: `${colors.blue}14` }]}>
              <Text style={[styles.chipText, { color: colors.blue }, fontStyle('semibold')]}>
                {fileSummary}
              </Text>
            </View>
          ) : null}

          <View style={styles.steps}>
            {steps.map((step) => (
              <View
                key={step.id}
                style={[
                  styles.step,
                  {
                    backgroundColor: step.active
                      ? colors.blue
                      : step.done
                        ? `${colors.blue}18`
                        : isDark
                          ? colors.surface
                          : `${colors.blue}08`,
                    transform: [{ scale: step.active ? 1.04 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: step.active ? '#fff' : step.done ? colors.blue : colors.muted,
                    },
                    fontStyle('semibold'),
                  ]}
                >
                  {step.id}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.track, { backgroundColor: isDark ? colors.surface : `${colors.blue}10` }]}>
            <Animated.View style={[styles.fill, barStyle, { backgroundColor: colors.blue }]} />
          </View>

          <View style={styles.footer}>
            <Animated.Text
              style={[styles.stage, labelStyle, { color: colors.muted }, fontStyle('medium')]}
            >
              {stage}
            </Animated.Text>
            <Animated.Text
              style={[styles.percent, percentStyle, { color: colors.heading }, fontStyle('bold')]}
            >
              {clamped}%
            </Animated.Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 28, 51, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
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
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  chipText: {
    fontSize: 12,
  },
  steps: {
    width: '100%',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  step: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 7,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  track: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  footer: {
    marginTop: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stage: {
    fontSize: 13,
  },
  percent: {
    fontSize: 15,
  },
});
