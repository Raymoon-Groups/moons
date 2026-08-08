import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const AUTO_SCROLL_MS = 2000;

type IntroSlide = {
  key: string;
  title: string;
  description: string;
  welcome?: boolean;
  centerIcon?: keyof typeof Ionicons.glyphMap;
  orbitIcons?: Array<keyof typeof Ionicons.glyphMap>;
};

const SLIDES: IntroSlide[] = [
  {
    key: 'smart-search',
    centerIcon: 'search',
    orbitIcons: [
      'wallet-outline',
      'briefcase-outline',
      'construct-outline',
      'location-outline',
      'business-outline',
      'phone-portrait-outline',
    ],
    title: 'Smart Search',
    description:
      'Search jobseekers and jobs by key skills, location, experience, and many other criteria.',
  },
  {
    key: 'track-applies',
    centerIcon: 'eye-outline',
    orbitIcons: [
      'document-text-outline',
      'checkmark-circle-outline',
      'time-outline',
      'people-outline',
      'notifications-outline',
      'trending-up-outline',
    ],
    title: 'Track Applies',
    description:
      'Keep track of applies on your job postings and step-by-step related updates.',
  },
  {
    key: 'jobs',
    centerIcon: 'briefcase',
    orbitIcons: [
      'search-outline',
      'filter-outline',
      'bookmark-outline',
      'send-outline',
      'stats-chart-outline',
      'star-outline',
    ],
    title: 'Discover opportunities',
    description: 'Browse roles, apply in seconds, and track every application from your phone.',
  },
  {
    key: 'network',
    centerIcon: 'people',
    orbitIcons: [
      'person-add-outline',
      'chatbubble-outline',
      'globe-outline',
      'ribbon-outline',
      'heart-outline',
      'link-outline',
    ],
    title: 'Build your network',
    description: 'Connect with recruiters and professionals who match your career goals.',
  },
  {
    key: 'messages',
    centerIcon: 'chatbubbles',
    orbitIcons: [
      'mail-outline',
      'attach-outline',
      'image-outline',
      'mic-outline',
      'checkmark-done-outline',
      'notifications-outline',
    ],
    title: 'Message directly',
    description: 'Stay in touch with your connections without leaving the app.',
  },
  {
    key: 'welcome',
    welcome: true,
    title: 'Welcome to MoonsJob',
    description: 'Your career hub for jobs, networking, and messaging — all in one place.',
  },
];

type AppIntroProps = {
  onComplete: () => void;
};

function OrbitIllustration({
  centerIcon,
  orbitIcons,
  blue,
  surface,
  border,
}: {
  centerIcon: keyof typeof Ionicons.glyphMap;
  orbitIcons: Array<keyof typeof Ionicons.glyphMap>;
  blue: string;
  surface: string;
  border: string;
}) {
  const size = 220;
  const radius = 78;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, marginBottom: theme.spacing.xl }}>
      <View
        style={{
          position: 'absolute',
          top: center - 78,
          left: center - 78,
          width: 156,
          height: 156,
          borderRadius: 78,
          borderWidth: 1.5,
          borderColor: `${blue}33`,
          borderStyle: 'dashed',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: center - 44,
          left: center - 44,
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${blue}18`,
          borderWidth: 1,
          borderColor: `${blue}44`,
        }}
      >
        <Ionicons name={centerIcon} size={36} color={blue} />
      </View>
      {orbitIcons.map((icon, i) => {
        const angle = (Math.PI * 2 * i) / orbitIcons.length - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - 18;
        const y = center + radius * Math.sin(angle) - 18;
        return (
          <View
            key={`${icon}-${i}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: surface,
              borderWidth: 1,
              borderColor: border,
              shadowColor: '#0f172a',
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Ionicons name={icon} size={16} color={blue} />
          </View>
        );
      })}
    </View>
  );
}

export function AppIntro({ onComplete }: AppIntroProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<IntroSlide>>(null);
  const indexRef = useRef(0);
  const pausingRef = useRef(false);
  const [index, setIndex] = useState(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: isDark ? colors.background : '#f4f6fc' },
        topGlow: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 320,
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
        title: {
          fontSize: 28,
          color: colors.heading,
          textAlign: 'center',
          marginBottom: theme.spacing.sm,
          ...fontStyle('bold'),
        },
        description: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.muted,
          textAlign: 'center',
          maxWidth: 300,
          ...fontStyle('regular'),
        },
        dots: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
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
    [colors, isDark],
  );

  const isLast = index === SLIDES.length - 1;

  const scrollTo = useCallback((next: number, animated = true) => {
    const clamped = Math.max(0, Math.min(next, SLIDES.length - 1));
    listRef.current?.scrollToIndex({ index: clamped, animated });
    indexRef.current = clamped;
    setIndex(clamped);
  }, []);

  const goNext = useCallback(() => {
    if (indexRef.current >= SLIDES.length - 1) {
      onComplete();
      return;
    }
    scrollTo(indexRef.current + 1);
  }, [onComplete, scrollTo]);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausingRef.current) return;
      if (indexRef.current >= SLIDES.length - 1) {
        // Stay on last slide until user taps Get started
        return;
      }
      scrollTo(indexRef.current + 1);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(id);
  }, [scrollTo]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== indexRef.current) {
      indexRef.current = next;
      setIndex(next);
    }
  }, []);

  const renderSlide: ListRenderItem<IntroSlide> = useCallback(
    ({ item }) => (
      <View style={styles.slide}>
        {item.welcome ? (
          <View style={{ marginBottom: theme.spacing.xl }}>
            <MoonsLogo size="xl" variant="onDark" />
          </View>
        ) : item.centerIcon && item.orbitIcons ? (
          <OrbitIllustration
            centerIcon={item.centerIcon}
            orbitIcons={item.orbitIcons}
            blue={colors.blue}
            surface={colors.surfaceElevated}
            border={colors.border}
          />
        ) : null}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    ),
    [colors.blue, colors.border, colors.surfaceElevated, styles],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(74, 127, 212, 0.22)', 'rgba(26, 39, 68, 0.1)', 'transparent']
            : ['rgba(186, 210, 245, 0.7)', 'rgba(232, 238, 252, 0.9)', 'transparent']
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
        onScrollBeginDrag={() => {
          pausingRef.current = true;
        }}
        onMomentumScrollEnd={() => {
          // Resume auto-scroll shortly after a manual swipe
          setTimeout(() => {
            pausingRef.current = false;
          }, AUTO_SCROLL_MS);
        }}
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
                  backgroundColor: i === index ? colors.blue : `${colors.blue}35`,
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
