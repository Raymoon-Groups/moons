import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
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

type OrbitItem = {
  name: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
};

const { width: SCREEN_W } = Dimensions.get('window');
const STAGE = Math.min(320, SCREEN_W * 0.82);
const ORBIT_RADIUS = STAGE * 0.4;
const CHIP = 56;

const SWIPE_H = 64;
const THUMB = 52;
const TRACK_PAD = 6;

const ORBIT_ITEMS: OrbitItem[] = [
  { name: 'briefcase', colors: ['#5B8DEF', '#3F74CC'] },
  { name: 'people', colors: ['#2EC4A8', '#1A9A84'] },
  { name: 'business', colors: ['#6B7FD7', '#4E5FC0'] },
  { name: 'document-text', colors: ['#F08A4B', '#D96B2A'] },
  { name: 'chatbubbles', colors: ['#4AA8F0', '#2F86D4'] },
  { name: 'rocket', colors: ['#EF6F8A', '#D24D6B'] },
];

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
        {!ready ? (
          <ActivityIndicator color={blue} />
        ) : (
          <>
            <Text style={[swipeStyles.label, { color: blueDark }]}>Swipe to get started</Text>
            <Animated.View style={{ transform: [{ translateX: hintX }], flexDirection: 'row' }}>
              <Ionicons name="chevron-forward" size={16} color={blue} />
              <Ionicons
                name="chevron-forward"
                size={16}
                color={blue}
                style={{ marginLeft: -8, opacity: 0.55 }}
              />
            </Animated.View>
          </>
        )}
      </Animated.View>

      <Animated.View
        style={[
          swipeStyles.thumb,
          {
            backgroundColor: blue,
            transform: [{ translateX: dragX }],
          },
        ]}
      >
        {ready ? (
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        ) : (
          <ActivityIndicator color="#fff" />
        )}
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingLeft: THUMB,
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.2,
    ...displayFontStyle('semibold'),
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

  const bgFade = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const orbitOpacity = useRef(new Animated.Value(0)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const copyY = useRef(new Animated.Value(20)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(24)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const reverseSpin = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const meshDrift = useRef(new Animated.Value(0)).current;
  const iconBobs = useRef(ORBIT_ITEMS.map(() => new Animated.Value(0))).current;

  useLoop(orbitSpin, 1, 15000, false);
  useLoop(reverseSpin, 1, 20000, false);
  useLoop(glowPulse, 1, 2000, true);
  useLoop(meshDrift, 1, 7000, true);

  useEffect(() => {
    const loops = iconBobs.map((bob, i) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(bob, {
            toValue: 1,
            duration: 980 + i * 70,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 980 + i * 70,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return anim;
    });
    return () => loops.forEach((a) => a.stop());
  }, [iconBobs]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgFade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(orbitOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(copyOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(copyY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(ctaY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    bgFade,
    copyOpacity,
    copyY,
    ctaOpacity,
    ctaY,
    logoOpacity,
    logoScale,
    orbitOpacity,
  ]);

  const orbitRotate = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const orbitCounter = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const reverseRotate = reverseSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const glowAlpha = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });
  const meshA = meshDrift.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  const meshB = meshDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: '#F3F7FC' },
        layer: { ...StyleSheet.absoluteFillObject },
        blob: { position: 'absolute', borderRadius: 999 },
        column: {
          flex: 1,
          paddingTop: insets.top + 12,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          paddingHorizontal: theme.spacing.lg,
          justifyContent: 'space-between',
        },
        topBlock: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          gap: 18,
        },
        stage: {
          width: STAGE,
          height: STAGE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        softGlow: {
          position: 'absolute',
          width: STAGE * 0.58,
          height: STAGE * 0.58,
          borderRadius: STAGE * 0.29,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: 'rgba(207, 217, 232, 0.9)',
          shadowColor: '#14233f',
          shadowOpacity: 0.1,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
          zIndex: 5,
        },
        ring: {
          position: 'absolute',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(63, 116, 204, 0.18)',
        },
        ringDashed: {
          position: 'absolute',
          borderRadius: 999,
          borderWidth: 1.25,
          borderStyle: 'dashed',
          borderColor: 'rgba(63, 116, 204, 0.28)',
        },
        logoMark: {
          zIndex: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        orbitItem: {
          position: 'absolute',
          width: CHIP,
          height: CHIP,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconShell: {
          width: CHIP,
          height: CHIP,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.6)',
          shadowColor: '#14233f',
          shadowOpacity: 0.16,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          elevation: 5,
        },
        copyBlock: {
          alignItems: 'center',
          maxWidth: 340,
          paddingHorizontal: 6,
        },
        eyebrow: {
          marginBottom: 12,
          fontSize: 12,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: colors.blue,
          ...displayFontStyle('semibold'),
        },
        headline: {
          fontSize: Math.min(42, SCREEN_W * 0.1),
          lineHeight: Math.min(48, SCREEN_W * 0.116),
          color: colors.navy,
          textAlign: 'center',
          letterSpacing: -1.4,
          ...displayFontStyle('extrabold'),
        },
        accentWord: {
          color: colors.blue,
        },
        subhead: {
          marginTop: 14,
          fontSize: 16,
          lineHeight: 25,
          color: colors.muted,
          textAlign: 'center',
          letterSpacing: -0.1,
          maxWidth: 310,
          ...displayFontStyle('medium'),
        },
        footer: {
          width: '100%',
          paddingTop: 18,
        },
      }),
    [colors, insets.bottom, insets.top],
  );

  const center = STAGE / 2;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.layer, { opacity: bgFade }]} pointerEvents="none">
        <LinearGradient
          colors={['#EAF2FB', '#F5F8FC', '#EEF3F9']}
          locations={[0, 0.5, 1]}
          style={styles.layer}
        />
        <Animated.View
          style={[
            styles.blob,
            {
              width: SCREEN_W * 0.75,
              height: SCREEN_W * 0.75,
              top: -SCREEN_W * 0.18,
              right: -SCREEN_W * 0.22,
              backgroundColor: 'rgba(63, 116, 204, 0.14)',
              transform: [{ translateY: meshA }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.blob,
            {
              width: SCREEN_W * 0.55,
              height: SCREEN_W * 0.55,
              bottom: SCREEN_W * 0.02,
              left: -SCREEN_W * 0.2,
              backgroundColor: 'rgba(46, 196, 168, 0.1)',
              transform: [{ translateY: meshB }],
            },
          ]}
        />
      </Animated.View>

      <View style={styles.column}>
        <View style={styles.topBlock}>
          <View style={styles.stage}>
            <Animated.View
              style={[
                styles.softGlow,
                {
                  opacity: Animated.multiply(logoOpacity, glowAlpha),
                  transform: [{ scale: glowScale }],
                },
              ]}
            />

            <Animated.View
              style={{
                position: 'absolute',
                width: STAGE,
                height: STAGE,
                opacity: orbitOpacity,
                transform: [{ rotate: reverseRotate }],
              }}
              pointerEvents="none"
            >
              <View
                style={[
                  styles.ringDashed,
                  {
                    width: ORBIT_RADIUS * 2.15,
                    height: ORBIT_RADIUS * 2.15,
                    top: center - ORBIT_RADIUS * 1.075,
                    left: center - ORBIT_RADIUS * 1.075,
                  },
                ]}
              />
            </Animated.View>

            <Animated.View
              style={{
                position: 'absolute',
                width: STAGE,
                height: STAGE,
                opacity: orbitOpacity,
                transform: [{ rotate: orbitRotate }],
              }}
              pointerEvents="none"
            >
              <View
                style={[
                  styles.ring,
                  {
                    width: ORBIT_RADIUS * 2,
                    height: ORBIT_RADIUS * 2,
                    top: center - ORBIT_RADIUS,
                    left: center - ORBIT_RADIUS,
                  },
                ]}
              />

              {ORBIT_ITEMS.map((item, i) => {
                const angle = (Math.PI * 2 * i) / ORBIT_ITEMS.length - Math.PI / 2;
                const x = center + ORBIT_RADIUS * Math.cos(angle) - CHIP / 2;
                const y = center + ORBIT_RADIUS * Math.sin(angle) - CHIP / 2;
                const bobY = iconBobs[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                });
                const bobScale = iconBobs[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.07],
                });

                return (
                  <Animated.View
                    key={`${item.name}-${i}`}
                    style={[
                      styles.orbitItem,
                      {
                        left: x,
                        top: y,
                        transform: [
                          { rotate: orbitCounter },
                          { translateY: bobY },
                          { scale: bobScale },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient colors={item.colors} style={styles.iconShell}>
                      <Ionicons name={item.name} size={24} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                );
              })}
            </Animated.View>

            <Animated.View
              style={[
                styles.logoMark,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
              ]}
            >
              <MoonsLogo size="xxl" />
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
              Your next chapter{'\n'}
              <Text style={styles.accentWord}>starts here.</Text>
            </Text>
            <Text style={styles.subhead}>
              Search jobs, build your profile, and connect with recruiters — simply and beautifully.
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[styles.footer, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}
        >
          <SwipeGetStarted
            ready={continueReady}
            onComplete={onGetStarted}
            blue={colors.blue}
            blueDark={colors.blueDark}
          />
        </Animated.View>
      </View>
    </View>
  );
}
