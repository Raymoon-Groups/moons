import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function InlineUploadProgress({
  progress,
  label,
  onSuccessHoldComplete,
}: {
  progress: number;
  label: string;
  onSuccessHoldComplete?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const target = Math.max(0, Math.min(100, progress));
  const [visual, setVisual] = useState(() => Math.min(target, 6));
  const [phase, setPhase] = useState<'uploading' | 'success'>('uploading');
  const visualRef = useRef(visual);
  const targetRef = useRef(target);
  const finishRef = useRef<{ from: number; startedAt: number; duration: number } | null>(null);
  const holdDone = useRef(false);
  const successScale = useSharedValue(0.85);
  const shimmerX = useSharedValue(-1);
  const spin = useSharedValue(0);
  const onCompleteRef = useRef(onSuccessHoldComplete);
  onCompleteRef.current = onSuccessHoldComplete;
  targetRef.current = target;
  visualRef.current = visual;

  useEffect(() => {
    shimmerX.value = -1;
    shimmerX.value = withRepeat(
      withTiming(1.2, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    spin.value = withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1, false);
  }, [shimmerX, spin]);

  useEffect(() => {
    let frame: ReturnType<typeof setInterval> | null = null;
    let last = Date.now();

    frame = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const goal = targetRef.current;
      let next = visualRef.current;

      if (goal >= 100) {
        if (!finishRef.current) {
          const from = visualRef.current;
          finishRef.current = {
            from,
            startedAt: now,
            // Keep the ceremonial finish short enough that the banner stays mounted.
            duration: Math.max(700, Math.min(1600, (100 - from) * 22)),
          };
        }
        const fin = finishRef.current;
        const t = Math.min(1, (now - fin.startedAt) / fin.duration);
        next = fin.from + (100 - fin.from) * easeOutCubic(t);
        if (t >= 1) {
          visualRef.current = 100;
          setVisual(100);
          setPhase('success');
          successScale.value = withSpring(1, { damping: 12, stiffness: 180 });
          if (frame) clearInterval(frame);
          return;
        }
      } else {
        finishRef.current = null;
        const remaining = goal - next;
        if (Math.abs(remaining) > 0.05) {
          const speed = Math.max(5.5, Math.min(11, Math.abs(remaining) * 0.85));
          next = remaining > 0 ? Math.min(goal, next + speed * dt) : Math.max(goal, next - speed * dt);
        }
      }

      visualRef.current = next;
      setVisual(next);
    }, 32);

    return () => {
      if (frame) clearInterval(frame);
    };
  }, [successScale]);

  useEffect(() => {
    if (phase !== 'success' || holdDone.current) return;
    holdDone.current = true;
    const id = setTimeout(() => {
      onCompleteRef.current?.();
    }, 1000);
    return () => clearTimeout(id);
  }, [phase]);

  const pct = Math.round(visual);
  const widthPct = `${Math.min(100, Math.max(0, visual))}%` as `${number}%`;

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 120 }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  if (phase === 'success') {
    return (
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : '#ecfdf5',
            borderColor: isDark ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.3)',
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel="Your post is posted"
      >
        <View style={styles.row}>
          <Animated.View style={[styles.checkWrap, checkStyle]}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Animated.View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: isDark ? '#6ee7b7' : '#065f46' }, fontStyle('bold')]}>
              Your post is posted
            </Text>
            <Text
              style={[
                styles.sub,
                { color: isDark ? 'rgba(167,243,208,0.8)' : '#047857' },
                fontStyle('regular'),
              ]}
            >
              Updating your feed…
            </Text>
          </View>
        </View>
        <View style={styles.barPad}>
          <View style={[styles.track, { backgroundColor: 'rgba(16,185,129,0.22)' }]}>
            <View style={[styles.fill, { width: '100%', backgroundColor: '#10b981', borderRadius: 999 }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderColor: isDark ? colors.border : 'rgba(15,28,51,0.08)',
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <View style={styles.row}>
        <View style={[styles.spinnerWrap, { backgroundColor: `${colors.blue}14` }]}>
          <Animated.View
            style={[
              styles.spinnerRing,
              { borderColor: `${colors.blue}28`, borderTopColor: colors.blue },
              spinStyle,
            ]}
          />
          <View style={[styles.spinnerDot, { backgroundColor: colors.blue }]} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.heading }, fontStyle('semibold')]}>{label}</Text>
          <Text style={[styles.sub, { color: colors.muted }, fontStyle('regular')]}>
            Your post will appear when this finishes
          </Text>
        </View>
        <Text style={[styles.percent, { color: colors.blue }, fontStyle('bold')]}>{pct}%</Text>
      </View>
      <View style={styles.barPad}>
        <View style={[styles.track, { backgroundColor: `${colors.blue}14` }]}>
          <View style={[styles.fillClip, { width: widthPct }]}>
            <LinearGradient
              colors={
                isDark
                  ? [colors.blue, '#8eb6f5', colors.blue]
                  : ['#2f5fad', colors.blue, '#6ea0ef']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradientFill}
            />
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  spinnerWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
  },
  spinnerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  checkWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  percent: {
    fontSize: 14,
    marginLeft: 'auto',
  },
  barPad: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  track: {
    height: 8,
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  fillClip: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
