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
import { displayFontStyle } from '@/lib/font-style';
import { theme } from '@/lib/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.min(SCREEN_H * 0.52, 420);
const AUTO_ADVANCE_MS = 2800;

type IntroSlide = {
  key: string;
  title: string;
  description: string;
  cta: string;
  theme: {
    gradient: [string, string, string];
    accent: string;
    soft: string;
    deep: string;
  };
  hero: 'search' | 'profile' | 'network' | 'start';
};

const SLIDES: IntroSlide[] = [
  {
    key: 'dream',
    title: 'Chase your dream role',
    description:
      'Explore jobs that match your skills, city, and ambitions — with a search experience built for India.',
    cta: 'Continue',
    theme: {
      gradient: ['#1B2A4A', '#243B6B', '#2F4F8C'],
      accent: '#8EB6FF',
      soft: '#4A6FA8',
      deep: '#121C33',
    },
    hero: 'search',
  },
  {
    key: 'profile',
    title: 'Build a profile that stands out',
    description:
      'Showcase experience, skills, and resume details so recruiters notice you faster.',
    cta: 'Continue',
    theme: {
      gradient: ['#B9D8F5', '#D7EAFB', '#EAF4FC'],
      accent: '#3F74CC',
      soft: '#7EB0E8',
      deep: '#2F5FAD',
    },
    hero: 'profile',
  },
  {
    key: 'network',
    title: 'Connect with the right people',
    description:
      'Message recruiters, grow your network, and keep every conversation in one place.',
    cta: 'Continue',
    theme: {
      gradient: ['#F6C9B8', '#F8D9CE', '#FBE8E1'],
      accent: '#D97757',
      soft: '#E8A48C',
      deep: '#C45F3F',
    },
    hero: 'network',
  },
  {
    key: 'start',
    title: 'Your career hub starts here',
    description:
      'Jobs, profiles, and messaging — designed to feel calm, modern, and ready when you are.',
    cta: 'Get Started',
    theme: {
      gradient: ['#C9D9F2', '#DDE7F7', '#EEF3FA'],
      accent: '#3F74CC',
      soft: '#8AA9D9',
      deep: '#243B6B',
    },
    hero: 'start',
  },
];

type AppIntroProps = {
  onComplete: () => void;
};

function FloatingShape({
  size,
  color,
  style,
  radius = 999,
}: {
  size: number;
  color: string;
  style?: object;
  radius?: number;
}) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function HeroArt({ slide }: { slide: IntroSlide }) {
  const { theme: t, hero } = slide;

  const card = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    sub: string,
    top: number,
    left: number,
    rotate = '0deg',
  ) => (
    <View
      style={[
        styles.floatCard,
        {
          top,
          left,
          transform: [{ rotate }],
          shadowColor: t.deep,
        },
      ]}
    >
      <View style={[styles.floatIcon, { backgroundColor: `${t.accent}22` }]}>
        <Ionicons name={icon} size={18} color={t.deep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.floatTitle, { color: t.deep }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.floatSub, { color: `${t.deep}99` }]} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.heroStage}>
      <FloatingShape size={160} color={`${t.accent}33`} style={{ top: 18, right: -20 }} />
      <FloatingShape size={90} color={`${t.soft}55`} style={{ bottom: 36, left: -10 }} />
      <FloatingShape
        size={48}
        color={`${t.accent}66`}
        radius={14}
        style={{ top: 48, left: 28, transform: [{ rotate: '18deg' }] }}
      />
      <FloatingShape
        size={36}
        color={`${t.soft}77`}
        radius={12}
        style={{ bottom: 70, right: 40, transform: [{ rotate: '-12deg' }] }}
      />

      <View style={[styles.heroCore, { backgroundColor: '#FFFFFFEE', shadowColor: t.deep }]}>
        <LinearGradient
          colors={[`${t.accent}33`, `${t.soft}22`]}
          style={styles.heroCoreGlow}
        />
        <Ionicons
          name={
            hero === 'search'
              ? 'briefcase'
              : hero === 'profile'
                ? 'person'
                : hero === 'network'
                  ? 'people'
                  : 'rocket'
          }
          size={54}
          color={t.deep}
        />
      </View>

      {hero === 'search' && (
        <>
          {card('search', 'UI Designer', 'Bangalore · Full-time', 34, 18, '-6deg')}
          {card('location', 'Remote roles', '240+ openings', 210, SCREEN_W * 0.42, '5deg')}
        </>
      )}
      {hero === 'profile' && (
        <>
          {card('document-text', 'Resume ready', 'ATS score 92%', 40, SCREEN_W * 0.38, '4deg')}
          {card('ribbon', 'Skills added', 'React · Design', 200, 24, '-5deg')}
        </>
      )}
      {hero === 'network' && (
        <>
          {card('chatbubbles', 'New message', 'Recruiter replied', 36, 22, '-4deg')}
          {card('person-add', 'Connection', 'Accepted', 205, SCREEN_W * 0.4, '6deg')}
        </>
      )}
      {hero === 'start' && (
        <>
          {card('checkmark-circle', 'All set', 'Profile complete', 42, SCREEN_W * 0.36, '3deg')}
          {card('flash', 'Start applying', 'Today', 208, 28, '-6deg')}
        </>
      )}
    </View>
  );
}

export function AppIntro({ onComplete }: AppIntroProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<IntroSlide>>(null);
  const indexRef = useRef(0);
  const pausingRef = useRef(false);
  const [index, setIndex] = useState(0);

  const active = SLIDES[index] ?? SLIDES[0];

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
        onComplete();
        return;
      }
      scrollTo(indexRef.current + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [onComplete, scrollTo]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== indexRef.current && next >= 0 && next < SLIDES.length) {
      indexRef.current = next;
      setIndex(next);
    }
  }, []);

  const renderSlide: ListRenderItem<IntroSlide> = useCallback(
    ({ item }) => (
      <View style={styles.slide}>
        <LinearGradient colors={item.theme.gradient} style={styles.heroBleed}>
          <HeroArt slide={item} />
        </LinearGradient>
      </View>
    ),
    [],
  );

  const bottomBg = useMemo(() => {
    return `${active.theme.gradient[2]}`;
  }, [active]);

  return (
    <View style={[styles.root, { backgroundColor: bottomBg }]}>
      <Pressable
        onPress={onComplete}
        style={[
          styles.skip,
          {
            top: insets.top + 10,
            backgroundColor:
              index === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(20, 35, 63, 0.08)',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        <Text
          style={[
            styles.skipText,
            { color: index === 0 ? '#FFFFFF' : active.theme.deep },
          ]}
        >
          Skip
        </Text>
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
          setTimeout(() => {
            pausingRef.current = false;
          }, AUTO_ADVANCE_MS);
        }}
        style={styles.list}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
      />

      <View
        style={[
          styles.panel,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 8,
            backgroundColor: '#F7F9FC',
          },
        ]}
      >
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                {
                  width: i === index ? 28 : 8,
                  backgroundColor: i === index ? active.theme.deep : `${active.theme.deep}33`,
                },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.title, { color: active.theme.deep }]}>{active.title}</Text>
        <Text style={styles.description}>{active.description}</Text>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.ctaLabel, { color: active.theme.deep }]}>{active.cta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  skip: {
    position: 'absolute',
    right: theme.spacing.md,
    zIndex: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 14,
    ...displayFontStyle('semibold'),
  },
  list: {
    flexGrow: 0,
    height: HERO_H + 24,
  },
  slide: {
    width: SCREEN_W,
    height: HERO_H + 24,
  },
  heroBleed: {
    flex: 1,
    paddingTop: 56,
    overflow: 'hidden',
  },
  heroStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCore: {
    width: 118,
    height: 118,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  heroCoreGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  floatCard: {
    position: 'absolute',
    width: SCREEN_W * 0.46,
    maxWidth: 190,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  floatIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatTitle: {
    fontSize: 13,
    ...displayFontStyle('bold'),
  },
  floatSub: {
    marginTop: 2,
    fontSize: 11,
    ...displayFontStyle('medium'),
  },
  panel: {
    flex: 1,
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 18,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
  title: {
    fontSize: Math.min(34, SCREEN_W * 0.082),
    lineHeight: Math.min(40, SCREEN_W * 0.098),
    letterSpacing: -0.8,
    marginBottom: 10,
    ...displayFontStyle('extrabold'),
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#6A7B92',
    maxWidth: 340,
    marginBottom: 28,
    ...displayFontStyle('medium'),
  },
  cta: {
    marginTop: 'auto',
    height: 56,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14233f',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(20, 35, 63, 0.06)',
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  ctaLabel: {
    fontSize: 16,
    letterSpacing: 0.2,
    ...displayFontStyle('bold'),
  },
});
