import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoonsLogo } from '@/components/moons-logo';
import { displayFontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

type AppSplashProps = {
  onGetStarted: () => void;
  continueReady?: boolean;
};

const SWIPE_H = 64;
const THUMB = 52;
const TRACK_PAD = 6;

const CANDIDATE_IMG = require('@/assets/landing/candidtae-1.png');
const RECRUITER_IMG = require('@/assets/landing/recruiter-2.png');

function useLoop(
  value: Animated.Value,
  toValue: number,
  duration: number,
  reverse = true,
) {
  useEffect(() => {
    const anim = reverse
      ? Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        )
      : Animated.loop(
          Animated.timing(value, {
            toValue,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        );
    anim.start();
    return () => anim.stop();
  }, [duration, reverse, toValue, value]);
}

function SwipeGetStarted({
  onComplete,
  ready,
  blue,
  blueDark,
}: {
  onComplete: () => void;
  ready: boolean;
  blue: string;
  blueDark: string;
}) {
  const [trackW, setTrackW] = useState(0);
  const [done, setDone] = useState(false);
  const dragX = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const maxXRef = useRef(0);
  const completedRef = useRef(false);
  const startXRef = useRef(0);

  const maxX = Math.max(0, trackW - THUMB - TRACK_PAD * 2);
  maxXRef.current = maxX;

  useLoop(hintPulse, 1, 1100, true);

  const snapTo = (to: number) => {
    Animated.spring(dragX, {
      toValue: to,
      useNativeDriver: false,
      friction: 7,
      tension: 70,
    }).start(({ finished }) => {
      if (!finished) return;
      if (to >= maxXRef.current * 0.98 && !completedRef.current) {
        completedRef.current = true;
        setDone(true);
        onComplete();
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => ready && !completedRef.current && maxXRef.current > 0,
        onMoveShouldSetPanResponder: (_, g) =>
          ready &&
          !completedRef.current &&
          Math.abs(g.dx) > 4 &&
          Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          dragX.stopAnimation((value) => {
            startXRef.current = typeof value === 'number' ? value : 0;
          });
        },
        onPanResponderMove: (_, g) => {
          const next = Math.max(0, Math.min(maxXRef.current, startXRef.current + g.dx));
          dragX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const next = Math.max(0, Math.min(maxXRef.current, startXRef.current + g.dx));
          if (next >= maxXRef.current * 0.72) {
            snapTo(maxXRef.current);
          } else {
            snapTo(0);
          }
        },
        onPanResponderTerminate: () => snapTo(0),
      }),
    [dragX, onComplete, ready],
  );

  const fillW = dragX.interpolate({
    inputRange: [0, Math.max(maxX, 1)],
    outputRange: [THUMB + TRACK_PAD * 2, Math.max(trackW, THUMB + TRACK_PAD * 2)],
    extrapolate: 'clamp',
  });

  const labelOpacity = dragX.interpolate({
    inputRange: [0, Math.max(maxX * 0.45, 1)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const hintX = hintPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  return (
    <View
      style={[swipeStyles.track, !ready && swipeStyles.trackDisabled]}
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      {...(ready && !done ? panResponder.panHandlers : {})}
    >
      <Animated.View style={[swipeStyles.fill, { width: fillW, backgroundColor: blue }]} />

      <Animated.View style={[swipeStyles.labelWrap, { opacity: labelOpacity }]} pointerEvents="none">
        <Text style={[swipeStyles.label, { color: blueDark, opacity: ready ? 1 : 0.55 }]}>
          {ready ? 'Swipe to get started' : 'Preparing…'}
        </Text>
        {ready ? (
          <Animated.View style={{ transform: [{ translateX: hintX }], flexDirection: 'row' }}>
            <Ionicons name="chevron-forward" size={16} color={blue} />
            <Ionicons
              name="chevron-forward"
              size={16}
              color={blue}
              style={{ marginLeft: -8, opacity: 0.55 }}
            />
          </Animated.View>
        ) : null}
      </Animated.View>

      <Animated.View
        style={[
          swipeStyles.thumb,
          {
            backgroundColor: blue,
            transform: [{ translateX: dragX }],
            opacity: ready ? 1 : 0.7,
          },
        ]}
      >
        <Ionicons name="arrow-forward" size={22} color="#fff" />
      </Animated.View>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  track: {
    height: SWIPE_H,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(63, 116, 204, 0.18)',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#14233f',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  trackDisabled: {
    opacity: 0.85,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.18,
  },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingLeft: THUMB,
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.2,
    ...displayFontStyle('bold'),
  },
  thumb: {
    position: 'absolute',
    left: TRACK_PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2f5fad',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});

export function AppSplash({ onGetStarted, continueReady = false }: AppSplashProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const autoStarted = useRef(false);
  const onGetStartedRef = useRef(onGetStarted);
  onGetStartedRef.current = onGetStarted;

  const finish = useCallback(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    onGetStartedRef.current();
  }, []);

  useEffect(() => {
    const hard = setTimeout(finish, 20000);
    return () => clearTimeout(hard);
  }, [finish]);

  const bgFade = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoX = useRef(new Animated.Value(-16)).current;
  const candidateOpacity = useRef(new Animated.Value(0)).current;
  const candidateY = useRef(new Animated.Value(28)).current;
  const recruiterOpacity = useRef(new Animated.Value(0)).current;
  const recruiterY = useRef(new Animated.Value(28)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const copyY = useRef(new Animated.Value(18)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(22)).current;
  const meshDrift = useRef(new Animated.Value(0)).current;

  const heroW = Math.min(screenW - theme.spacing.lg * 2, 420);
  // Near-square assets, full image visible (no crop / no frame).
  const heroH = Math.min(heroW * 0.88, Math.max(220, screenW * 0.52));

  useLoop(meshDrift, 1, 7000, true);

  useEffect(() => {
    const hold = 2600;
    const slide = 720;

    const intro = Animated.sequence([
      Animated.timing(bgFade, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoX, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Candidate first
      Animated.parallel([
        Animated.timing(candidateOpacity, {
          toValue: 1,
          duration: slide,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(candidateY, {
          toValue: 0,
          duration: slide,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(copyOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(copyY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.timing(ctaY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    let cancelled = false;
    let active: Animated.CompositeAnimation | null = null;

    const toRecruiter = () =>
      Animated.parallel([
        Animated.timing(candidateOpacity, {
          toValue: 0,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(candidateY, {
          toValue: -18,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(recruiterOpacity, {
          toValue: 1,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(recruiterY, {
          toValue: 0,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

    const toCandidate = () =>
      Animated.parallel([
        Animated.timing(recruiterOpacity, {
          toValue: 0,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(recruiterY, {
          toValue: -18,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(candidateOpacity, {
          toValue: 1,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(candidateY, {
          toValue: 0,
          duration: slide,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

    const runCycle = (showRecruiterNext: boolean) => {
      if (cancelled) return;
      if (showRecruiterNext) {
        recruiterY.setValue(28);
        recruiterOpacity.setValue(0);
      } else {
        candidateY.setValue(28);
        candidateOpacity.setValue(0);
      }

      const holdAnim = Animated.delay(hold);
      active = holdAnim;
      holdAnim.start(({ finished }) => {
        if (!finished || cancelled) return;
        const swap = showRecruiterNext ? toRecruiter() : toCandidate();
        active = swap;
        swap.start(({ finished: ok }) => {
          if (!ok || cancelled) return;
          runCycle(!showRecruiterNext);
        });
      });
    };

    active = intro;
    intro.start(({ finished }) => {
      if (!finished || cancelled) return;
      runCycle(true);
    });

    return () => {
      cancelled = true;
      active?.stop();
    };
  }, [
    bgFade,
    candidateOpacity,
    candidateY,
    copyOpacity,
    copyY,
    ctaOpacity,
    ctaY,
    logoOpacity,
    logoX,
    recruiterOpacity,
    recruiterY,
  ]);

  const meshA = meshDrift.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const meshB = meshDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: '#F3F7FC' },
        layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
        blob: { position: 'absolute', borderRadius: 999 },
        column: {
          flex: 1,
          paddingTop: insets.top + 12,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          paddingHorizontal: theme.spacing.lg,
          justifyContent: 'space-between',
        },
        topBlock: {
          alignItems: 'flex-start',
          flexGrow: 1,
          justifyContent: 'flex-start',
          gap: 10,
          paddingTop: 2,
        },
        logoRow: {
          alignSelf: 'flex-start',
          marginBottom: 2,
        },
        heroStage: {
          width: heroW,
          height: heroH,
          alignSelf: 'stretch',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
          marginBottom: 4,
        },
        heroLayer: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroImage: {
          width: '100%',
          height: '100%',
        },
        copyBlock: {
          alignItems: 'center',
          alignSelf: 'stretch',
          marginTop: 6,
          paddingHorizontal: 4,
        },
        eyebrow: {
          marginBottom: 14,
          fontSize: 12,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: colors.blue,
          textAlign: 'center',
          ...displayFontStyle('semibold'),
        },
        headline: {
          fontSize: Math.min(40, screenW * 0.095),
          lineHeight: Math.min(46, screenW * 0.11),
          color: colors.navy,
          textAlign: 'center',
          letterSpacing: -1.3,
          ...displayFontStyle('extrabold'),
        },
        accentWord: {
          color: colors.blue,
        },
        subhead: {
          marginTop: 14,
          fontSize: 15,
          lineHeight: 23,
          color: colors.muted,
          textAlign: 'center',
          letterSpacing: -0.1,
          maxWidth: 320,
          ...displayFontStyle('medium'),
        },
        footer: {
          width: '100%',
          paddingTop: 12,
        },
      }),
    [colors, heroH, heroW, insets.bottom, insets.top, screenW],
  );

  return (
    <View style={styles.root}>
      <View style={styles.layer} pointerEvents="none">
        <LinearGradient
          colors={['#EAF2FB', '#F5F8FC', '#EEF3F9']}
          locations={[0, 0.5, 1]}
          style={styles.layer}
        />
      </View>

      <View style={styles.layer}>
        <Animated.View style={[styles.layer, { opacity: bgFade }]} pointerEvents="none">
          <Animated.View
            style={[
              styles.blob,
              {
                width: screenW * 0.72,
                height: screenW * 0.72,
                top: -screenW * 0.16,
                right: -screenW * 0.2,
                backgroundColor: 'rgba(63, 116, 204, 0.13)',
                transform: [{ translateY: meshA }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.blob,
              {
                width: screenW * 0.5,
                height: screenW * 0.5,
                bottom: screenW * 0.04,
                left: -screenW * 0.18,
                backgroundColor: 'rgba(46, 196, 168, 0.1)',
                transform: [{ translateY: meshB }],
              },
            ]}
          />
        </Animated.View>

        <View style={styles.column}>
          <View style={styles.topBlock}>
            <Animated.View
              style={[
                styles.logoRow,
                { opacity: logoOpacity, transform: [{ translateX: logoX }] },
              ]}
            >
              <MoonsLogo size="xl" />
            </Animated.View>

            <View style={styles.heroStage}>
              <Animated.View
                style={[
                  styles.heroLayer,
                  {
                    opacity: candidateOpacity,
                    transform: [{ translateY: candidateY }],
                  },
                ]}
              >
                <Image
                  source={CANDIDATE_IMG}
                  style={styles.heroImage}
                  contentFit="contain"
                  transition={0}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.heroLayer,
                  {
                    opacity: recruiterOpacity,
                    transform: [{ translateY: recruiterY }],
                  },
                ]}
              >
                <Image
                  source={RECRUITER_IMG}
                  style={styles.heroImage}
                  contentFit="contain"
                  transition={0}
                />
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.copyBlock,
                { opacity: copyOpacity, transform: [{ translateY: copyY }] },
              ]}
            >
              <Text style={styles.eyebrow}>MoonsJob</Text>
              <Text style={styles.headline}>
                Your next{'\n'}
                chapter{'\n'}
                <Text style={styles.accentWord}>starts here.</Text>
              </Text>
              <Text style={styles.subhead}>
                Search jobs, build your profile, and connect with recruiters — simply and
                beautifully.
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            style={[styles.footer, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}
          >
            <SwipeGetStarted
              ready={continueReady}
              onComplete={finish}
              blue={colors.blue}
              blueDark={colors.blueDark}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
