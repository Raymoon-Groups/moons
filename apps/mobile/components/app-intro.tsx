import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoonsLogo } from '@/components/moons-logo';
import { PrimaryButton } from '@/components/ui';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type IntroSlide = {
  key: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  welcome?: boolean;
};

const SLIDES: IntroSlide[] = [
  {
    key: 'welcome',
    welcome: true,
    title: 'Welcome to MoonsJob',
    description: 'Your career hub for jobs, networking, and messaging — all in one place.',
  },
  {
    key: 'jobs',
    icon: 'briefcase-outline',
    title: 'Discover opportunities',
    description: 'Browse roles, apply in seconds, and track every application from your phone.',
  },
  {
    key: 'network',
    icon: 'people-outline',
    title: 'Build your network',
    description: 'Connect with recruiters and professionals who match your goals.',
  },
  {
    key: 'messages',
    icon: 'chatbubble-outline',
    title: 'Message directly',
    description: 'Stay in touch with your connections without leaving the app.',
  },
];

type AppIntroProps = {
  onComplete: () => void;
};

export function AppIntro({ onComplete }: AppIntroProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<IntroSlide>>(null);
  const [index, setIndex] = useState(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        topGlow: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 280,
        },
        skip: {
          position: 'absolute',
          right: theme.spacing.md,
          zIndex: 2,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        skipText: {
          color: colors.muted,
          fontSize: 15,
          ...fontStyle('semibold'),
        },
        slide: {
          width: SCREEN_WIDTH,
          flex: 1,
          paddingHorizontal: theme.spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconCircle: {
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${colors.blue}18`,
          borderWidth: 1,
          borderColor: `${colors.blue}33`,
          marginBottom: theme.spacing.lg,
        },
        title: {
          fontSize: theme.typography.hero,
          color: colors.heading,
          textAlign: 'center',
          marginBottom: theme.spacing.sm,
          ...fontStyle('bold'),
        },
        description: {
          fontSize: theme.typography.subtitle,
          lineHeight: 22,
          color: colors.muted,
          textAlign: 'center',
          maxWidth: 320,
          ...fontStyle('regular'),
        },
        dots: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          marginBottom: theme.spacing.md,
        },
        dot: {
          height: 8,
          borderRadius: 4,
        },
        footer: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
        },
      }),
    [colors],
  );

  const isLast = index === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  }, [index, isLast, onComplete]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) setIndex(next);
  }, [index]);

  const renderSlide: ListRenderItem<IntroSlide> = useCallback(
    ({ item }) => (
      <View style={styles.slide}>
        {item.welcome ? (
          <View style={{ marginBottom: theme.spacing.xl }}>
            <MoonsLogo size="xl" variant="onDark" />
          </View>
        ) : item.icon ? (
          <View style={styles.iconCircle}>
            <Ionicons name={item.icon} size={40} color={colors.blue} />
          </View>
        ) : null}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    ),
    [colors.blue, styles],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(74, 127, 212, 0.22)', 'rgba(26, 39, 68, 0.1)', 'transparent']
            : ['rgba(186, 210, 245, 0.55)', 'rgba(74, 127, 212, 0.08)', 'transparent']
        }
        style={styles.topGlow}
        pointerEvents="none"
      />

      <Pressable
        onPress={onComplete}
        style={[styles.skip, { top: insets.top + 8 }]}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1, marginTop: insets.top + 40 }}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                {
                  width: i === index ? 22 : 8,
                  backgroundColor: i === index ? colors.blue : `${colors.muted}55`,
                },
              ]}
            />
          ))}
        </View>
        <PrimaryButton label={isLast ? 'Get started' : 'Next'} onPress={goNext} />
      </View>
    </View>
  );
}
