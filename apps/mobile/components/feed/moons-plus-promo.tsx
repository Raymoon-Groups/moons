import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { useAuth } from '@/lib/auth-context';
import { displayFontStyle, fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const CANDIDATE = {
  subtitle: 'Premium tools to stand out to recruiters',
  chips: ['Boost profile', 'Smart tips', 'Fast apply'],
};

const RECRUITER = {
  subtitle: 'Premium tools to hire faster and smarter',
  chips: ['Featured jobs', 'AI screen', 'Priority'],
};

const BUBBLES = [
  { left: '8%', top: '16%', size: 12, delay: 0 },
  { left: '24%', top: '68%', size: 8, delay: 400 },
  { left: '42%', top: '10%', size: 6, delay: 800 },
  { left: '58%', top: '72%', size: 11, delay: 200 },
  { left: '72%', top: '24%', size: 7, delay: 1100 },
  { left: '84%', top: '54%', size: 14, delay: 600 },
  { left: '16%', top: '42%', size: 9, delay: 900 },
] as const;

function FloatingBubble({
  left,
  top,
  size,
  delay,
  color,
}: {
  left: string;
  top: string;
  size: number;
  delay: number;
  color: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 2200 + delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2200 + delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.9, 0.35] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <Animated.View
      pointerEvents="none"
      style={
        {
          position: 'absolute',
          left,
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { scale }],
        } as object
      }
    />
  );
}

/** Mid-feed teaser so every user learns Moons Plus is coming. */
export function MoonsPlusPromoCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const copy = isRecruiter ? RECRUITER : CANDIDATE;

  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [float, pulse]);

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [`${colors.blue}44`, `${colors.blue}99`],
  });
  const iconY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const badgeScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginHorizontal: theme.spacing.md,
          marginVertical: compact ? 10 : 12,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1.5,
          backgroundColor: isDark ? colors.surfaceElevated : '#F7FAFF',
        },
        body: {
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
        icon: {
          width: 48,
          height: 48,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        moon: { color: '#fff', fontSize: 20, ...displayFontStyle('bold') },
        title: { fontSize: 20, color: colors.blue, ...displayFontStyle('bold') },
        subtitle: {
          marginTop: 2,
          fontSize: 12,
          lineHeight: 16,
          color: colors.muted,
          ...fontStyle('regular'),
        },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: `${colors.blue}55`,
          backgroundColor: `${colors.blue}18`,
          paddingHorizontal: 10,
          paddingVertical: 7,
        },
        badgeDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.blue,
        },
        badgeText: { fontSize: 11, color: colors.heading, ...fontStyle('semibold') },
        footer: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: `${colors.blue}28`,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        },
        chip: {
          borderRadius: 999,
          borderWidth: 1,
          borderColor: `${colors.blue}33`,
          backgroundColor: isDark ? colors.surface : '#fff',
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        chipText: { fontSize: 11, color: colors.blue, ...fontStyle('semibold') },
      }),
    [colors, isDark, compact],
  );

  return (
    <Animated.View style={[styles.wrap, { borderColor }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[`${colors.blue}14`, 'transparent', `${colors.navy}10`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {BUBBLES.map((b) => (
          <FloatingBubble
            key={`${b.left}-${b.top}`}
            left={b.left}
            top={b.top}
            size={b.size}
            delay={b.delay}
            color={`${colors.blue}55`}
          />
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.left}>
          <Animated.View style={{ transform: [{ translateY: iconY }] }}>
            <LinearGradient colors={[colors.blue, colors.navy]} style={styles.icon}>
              <Text style={styles.moon}>☽</Text>
            </LinearGradient>
          </Animated.View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>Moons Plus</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {copy.subtitle}
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Coming soon</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        {copy.chips.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
