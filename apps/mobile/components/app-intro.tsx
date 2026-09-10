import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { displayFontStyle, fontStyle } from '@/lib/font-style';
import { theme } from '@/lib/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.min(SCREEN_H * 0.58, 480);
const AUTO_ADVANCE_MS = 3200;
const PANEL_FADE_MS = 220;
const CARD_W = Math.min(SCREEN_W - 28, 360);

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
      'Browse real openings with salary, location, and skills — then apply in a tap.',
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
      'See how candidates shine — skills, experience, and a resume recruiters actually open.',
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
      'Discover candidates and recruiters, then message the people who can move your career forward.',
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
    title: 'Jobs and talent, one place',
    description:
      'Whether you are hiring or job hunting — MoonsJob keeps roles and people in one calm hub.',
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
  onComplete: (dest?: 'login' | 'register') => void;
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

function useFloat(delay = 0, distance = 8, duration = 2200) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, {
          toValue: -distance,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [delay, distance, duration, y]);
  return y;
}

function tapFeedback() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

function InteractiveCard({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: object;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6, tension: 160 }),
      Animated.timing(glow, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
      Animated.timing(glow, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.cardGlow,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
            },
          ]}
        />
        {children}
      </Animated.View>
    </Pressable>
  );
}

function AvatarBubble({
  initials,
  color,
  size = 36,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function JobPreviewCard({
  title,
  company,
  meta,
  salary,
  tags,
  logo,
  logoColor,
  style,
  deep,
  compact = false,
  onPress,
}: {
  title: string;
  company: string;
  meta: string;
  salary: string;
  tags: string[];
  logo: string;
  logoColor: string;
  style?: object;
  deep: string;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <InteractiveCard
      style={style}
      onPress={onPress}
      accessibilityLabel={`Preview job ${title} at ${company}`}
    >
      <View style={[styles.jobCard, compact && styles.jobCardCompact, { shadowColor: deep }]}>
        <View style={styles.jobCardTop}>
          <View style={[styles.companyLogo, compact && styles.companyLogoSm, { backgroundColor: logoColor }]}>
            <Text style={[styles.companyLogoText, compact && { fontSize: 13 }]}>{logo}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.jobTitle, compact && styles.jobTitleSm, { color: deep }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.jobCompany, compact && { fontSize: 11 }]} numberOfLines={1}>
              {company}
            </Text>
          </View>
          <View style={styles.salaryPill}>
            <Text style={[styles.salaryText, { color: deep }]}>{salary}</Text>
          </View>
        </View>
        {!compact ? <Text style={styles.jobMeta}>{meta}</Text> : null}
        <View style={[styles.tagRow, compact && { marginTop: 8 }]}>
          {(compact ? tags.slice(0, 2) : tags).map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={[styles.tagText, { color: deep }]}>{tag}</Text>
            </View>
          ))}
          {compact ? <Text style={styles.jobMetaInline}>{meta}</Text> : null}
        </View>
        <View style={styles.tapHintRow}>
          <Ionicons name="hand-left-outline" size={12} color="#91A0B5" />
          <Text style={styles.tapHintText}>Tap to preview</Text>
        </View>
      </View>
    </InteractiveCard>
  );
}

function CandidatePreviewCard({
  name,
  role,
  location,
  skills,
  initials,
  avatarColor,
  match,
  style,
  deep,
  accent,
  compact = false,
  onPress,
}: {
  name: string;
  role: string;
  location: string;
  skills: string[];
  initials: string;
  avatarColor: string;
  match?: string;
  style?: object;
  deep: string;
  accent: string;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <InteractiveCard
      style={style}
      onPress={onPress}
      accessibilityLabel={`Preview candidate ${name}`}
    >
      <View style={[styles.personCard, compact && styles.personCardCompact, { shadowColor: deep }]}>
        <View style={styles.personTop}>
          <AvatarBubble initials={initials} color={avatarColor} size={compact ? 34 : 42} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.personName, compact && styles.jobTitleSm, { color: deep }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.personRole, compact && { fontSize: 11 }]} numberOfLines={1}>
              {role}
            </Text>
            {!compact ? (
              <Text style={styles.personLoc} numberOfLines={1}>
                {location}
              </Text>
            ) : null}
          </View>
          {match ? (
            <View style={[styles.matchPill, { backgroundColor: `${accent}22` }]}>
              <Text style={[styles.matchText, { color: deep }]}>{match}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.tagRow, compact && { marginTop: 8 }]}>
          {skills.slice(0, compact ? 2 : 3).map((skill) => (
            <View key={skill} style={styles.tagChip}>
              <Text style={[styles.tagText, { color: deep }]}>{skill}</Text>
            </View>
          ))}
          {compact ? <Text style={styles.jobMetaInline}>{location}</Text> : null}
        </View>
        <View style={styles.tapHintRow}>
          <Ionicons name="hand-left-outline" size={12} color="#91A0B5" />
          <Text style={styles.tapHintText}>Tap to preview</Text>
        </View>
      </View>
    </InteractiveCard>
  );
}

function HeroArt({
  slide,
  onInteract,
}: {
  slide: IntroSlide;
  onInteract: (kind: 'job' | 'candidate' | 'message', label: string) => void;
}) {
  const { theme: t, hero } = slide;
  const floatA = useFloat(0, 5, 2400);
  const floatB = useFloat(350, 6, 2600);
  const floatC = useFloat(160, 5, 2100);
  const floatD = useFloat(500, 7, 2300);

  return (
    <View style={styles.heroStage}>
      <FloatingShape size={180} color={`${t.accent}24`} style={{ top: -10, right: -36 }} />
      <FloatingShape size={120} color={`${t.soft}36`} style={{ bottom: 8, left: -24 }} />

      {hero === 'search' && (
        <View style={styles.stack}>
          <Animated.View style={{ transform: [{ translateY: floatA }] }}>
            <JobPreviewCard
              compact
              title="Senior Product Designer"
              company="Nova Labs"
              meta="Bengaluru · Hybrid"
              salary="₹28–35 LPA"
              tags={['Figma', 'Systems']}
              logo="N"
              logoColor="#3F74CC"
              deep={t.deep}
              style={{ width: CARD_W }}
              onPress={() => onInteract('job', 'Senior Product Designer at Nova Labs')}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatB }], marginTop: -8 }}>
            <JobPreviewCard
              compact
              title="Frontend Engineer"
              company="Orbit Tech"
              meta="Remote · Full-time"
              salary="₹18–24 LPA"
              tags={['React', 'TypeScript']}
              logo="O"
              logoColor="#2EC4A8"
              deep={t.deep}
              style={{ width: CARD_W * 0.96, alignSelf: 'flex-end' }}
              onPress={() => onInteract('job', 'Frontend Engineer at Orbit Tech')}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatC }], marginTop: -8 }}>
            <JobPreviewCard
              compact
              title="Backend Developer"
              company="Pixelwave"
              meta="Hyderabad · Onsite"
              salary="₹16–22 LPA"
              tags={['Node', 'Postgres']}
              logo="P"
              logoColor="#6B7FD7"
              deep={t.deep}
              style={{ width: CARD_W * 0.94 }}
              onPress={() => onInteract('job', 'Backend Developer at Pixelwave')}
            />
          </Animated.View>
          <Pressable
            onPress={() => onInteract('job', '2.4k+ live jobs')}
            style={[styles.statPillInline, { backgroundColor: '#FFFFFF' }]}
          >
            <Ionicons name="briefcase" size={14} color={t.deep} />
            <Text style={[styles.statPillText, { color: t.deep }]}>2.4k+ live jobs near you</Text>
          </Pressable>
        </View>
      )}

      {hero === 'profile' && (
        <View style={styles.stack}>
          <Animated.View style={{ transform: [{ translateY: floatA }] }}>
            <CandidatePreviewCard
              compact
              name="Aisha Khan"
              role="UX Designer · 4 yrs"
              location="Mumbai"
              skills={['Research', 'Figma']}
              initials="AK"
              avatarColor="#6B7FD7"
              match="92% match"
              deep={t.deep}
              accent={t.accent}
              style={{ width: CARD_W }}
              onPress={() => onInteract('candidate', 'Aisha Khan')}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatB }], marginTop: -8 }}>
            <CandidatePreviewCard
              compact
              name="Arjun Patel"
              role="Product Manager · 6 yrs"
              location="Bengaluru"
              skills={['Roadmaps', 'B2B']}
              initials="AP"
              avatarColor="#3F74CC"
              match="88% match"
              deep={t.deep}
              accent={t.accent}
              style={{ width: CARD_W * 0.95, alignSelf: 'flex-end' }}
              onPress={() => onInteract('candidate', 'Arjun Patel')}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatC }], marginTop: -8 }}>
            <CandidatePreviewCard
              compact
              name="Meera Iyer"
              role="Marketing Lead · 5 yrs"
              location="Chennai"
              skills={['Brand', 'Growth']}
              initials="MI"
              avatarColor="#EF6F8A"
              match="Open to work"
              deep={t.deep}
              accent={t.accent}
              style={{ width: CARD_W * 0.92 }}
              onPress={() => onInteract('candidate', 'Meera Iyer')}
            />
          </Animated.View>
          <Animated.View
            style={{
              transform: [{ translateY: floatD }],
              marginTop: 4,
              flexDirection: 'row',
              gap: 8,
              justifyContent: 'space-between',
            }}
          >
            <InteractiveCard
              style={{ flex: 1 }}
              onPress={() => onInteract('candidate', 'Resume preview')}
              accessibilityLabel="Preview resume tip"
            >
              <View style={[styles.resumeChip, { shadowColor: t.deep }]}>
                <Ionicons name="document-text" size={16} color={t.deep} />
                <View>
                  <Text style={[styles.resumeTitle, { color: t.deep }]}>Resume ready</Text>
                  <Text style={styles.resumeSub}>ATS score 94%</Text>
                </View>
              </View>
            </InteractiveCard>
            <InteractiveCard
              style={{ flex: 1 }}
              onPress={() => onInteract('candidate', 'Skills preview')}
              accessibilityLabel="Preview skills tip"
            >
              <View style={[styles.resumeChip, { shadowColor: t.deep }]}>
                <Ionicons name="ribbon" size={16} color={t.deep} />
                <View>
                  <Text style={[styles.resumeTitle, { color: t.deep }]}>12 skills</Text>
                  <Text style={styles.resumeSub}>Verified profile</Text>
                </View>
              </View>
            </InteractiveCard>
          </Animated.View>
        </View>
      )}

      {hero === 'network' && (
        <View style={styles.stack}>
          <Animated.View style={{ transform: [{ translateY: floatA }] }}>
            <InteractiveCard
              onPress={() => onInteract('candidate', 'Top candidates')}
              accessibilityLabel="Preview top candidates"
            >
              <View style={[styles.networkCard, { shadowColor: t.deep, width: CARD_W }]}>
                <Text style={[styles.networkHeading, { color: t.deep }]}>Top candidates hiring now</Text>
                <View style={styles.avatarRow}>
                  {[
                    { i: 'RS', c: '#3F74CC' },
                    { i: 'PM', c: '#2EC4A8' },
                    { i: 'VK', c: '#D97757' },
                    { i: 'NS', c: '#6B7FD7' },
                    { i: 'AR', c: '#EF6F8A' },
                    { i: 'JK', c: '#243B6B' },
                  ].map((p, idx) => (
                    <View key={p.i} style={{ marginLeft: idx === 0 ? 0 : -12 }}>
                      <AvatarBubble initials={p.i} color={p.c} size={38} />
                    </View>
                  ))}
                  <View style={styles.moreAvatar}>
                    <Text style={styles.moreAvatarText}>+24</Text>
                  </View>
                </View>
              </View>
            </InteractiveCard>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatB }], marginTop: -6 }}>
            <CandidatePreviewCard
              compact
              name="Kabir Singh"
              role="Recruiter · FinTech"
              location="Gurgaon"
              skills={['Hiring', 'Sourcer']}
              initials="KS"
              avatarColor="#243B6B"
              match="Online"
              deep={t.deep}
              accent={t.accent}
              style={{ width: CARD_W * 0.96, alignSelf: 'flex-end' }}
              onPress={() => onInteract('candidate', 'Kabir Singh')}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatC }], marginTop: -6 }}>
            <InteractiveCard
              onPress={() => onInteract('message', 'Priya Sharma')}
              accessibilityLabel="Preview message from Priya Sharma"
            >
              <View style={[styles.messagePreviewCard, { shadowColor: t.deep, width: CARD_W }]}>
                <AvatarBubble initials="HR" color="#D97757" size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.messageName, { color: t.deep }]}>Priya Sharma · Recruiter</Text>
                  <Text style={styles.messageBody} numberOfLines={2}>
                    Loved your portfolio — free Thursday for a quick intro call?
                  </Text>
                </View>
              </View>
            </InteractiveCard>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatD }], marginTop: -6 }}>
            <InteractiveCard
              onPress={() => onInteract('message', 'Ananya')}
              accessibilityLabel="Preview message from Ananya"
            >
              <View
                style={[
                  styles.messagePreviewCard,
                  { shadowColor: t.deep, width: CARD_W * 0.94, alignSelf: 'flex-end' },
                ]}
              >
                <AvatarBubble initials="AN" color="#2EC4A8" size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.messageName, { color: t.deep }]}>Ananya · Talent Lead</Text>
                  <Text style={styles.messageBody} numberOfLines={2}>
                    We have a senior role that matches your React experience.
                  </Text>
                </View>
              </View>
            </InteractiveCard>
          </Animated.View>
        </View>
      )}

      {hero === 'start' && (
        <View style={styles.stack}>
          <Animated.View style={{ transform: [{ translateY: floatA }] }}>
            <JobPreviewCard
              compact
              title="Growth Marketer"
              company="Moons Studio"
              meta="Delhi NCR · Full-time"
              salary="₹12–16 LPA"
              tags={['SEO', 'Content']}
              logo="M"
              logoColor="#3F74CC"
              deep={t.deep}
              style={{ width: CARD_W }}
              onPress={() => onInteract('job', 'Growth Marketer at Moons Studio')}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatB }], marginTop: -8 }}>
            <CandidatePreviewCard
              compact
              name="Rohan Mehta"
              role="Full-stack Dev · 3 yrs"
              location="Pune"
              skills={['Node', 'React']}
              initials="RM"
              avatarColor="#2EC4A8"
              match="Open to work"
              deep={t.deep}
              accent={t.accent}
              style={{ width: CARD_W * 0.96, alignSelf: 'flex-end' }}
              onPress={() => onInteract('candidate', 'Rohan Mehta')}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: floatC }], marginTop: -8 }}>
            <JobPreviewCard
              compact
              title="HR Business Partner"
              company="CloudNest"
              meta="Remote · Contract"
              salary="₹9–12 LPA"
              tags={['People', 'Ops']}
              logo="C"
              logoColor="#6B7FD7"
              deep={t.deep}
              style={{ width: CARD_W * 0.93 }}
              onPress={() => onInteract('job', 'HR Business Partner at CloudNest')}
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function ProgressDots({
  index,
  color,
}: {
  index: number;
  color: string;
}) {
  const widths = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 28 : 8))).current;

  useEffect(() => {
    Animated.parallel(
      widths.map((w, i) =>
        Animated.timing(w, {
          toValue: i === index ? 28 : 8,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [index, widths]);

  return (
    <View style={styles.dots}>
      {SLIDES.map((slide, i) => (
        <Animated.View
          key={slide.key}
          style={[
            styles.dot,
            {
              width: widths[i],
              backgroundColor: i === index ? color : `${color}33`,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function AppIntro({ onComplete }: AppIntroProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<IntroSlide>>(null);
  const indexRef = useRef(0);
  const draggingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completingRef = useRef(false);
  const panelTargetRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [authGate, setAuthGate] = useState<{
    kind: 'job' | 'candidate' | 'message';
    label: string;
  } | null>(null);
  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const active = SLIDES[index] ?? SLIDES[0];

  const syncPanel = useCallback(
    (next: number) => {
      if (next === panelTargetRef.current) return;
      panelTargetRef.current = next;

      Animated.parallel([
        Animated.timing(panelOpacity, {
          toValue: 0,
          duration: PANEL_FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslate, {
          toValue: 8,
          duration: PANEL_FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setIndex(next);
        panelTranslate.setValue(-8);
        Animated.parallel([
          Animated.timing(panelOpacity, {
            toValue: 1,
            duration: PANEL_FADE_MS + 40,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(panelTranslate, {
            toValue: 0,
            duration: PANEL_FADE_MS + 40,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [panelOpacity, panelTranslate],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (dest?: 'login' | 'register') => {
      if (completingRef.current) return;
      completingRef.current = true;
      clearTimer();
      onComplete(dest);
    },
    [clearTimer, onComplete],
  );

  const scrollTo = useCallback(
    (next: number, animated = true) => {
      const clamped = Math.max(0, Math.min(next, SLIDES.length - 1));
      if (clamped === indexRef.current) return;
      indexRef.current = clamped;
      listRef.current?.scrollToIndex({ index: clamped, animated });
      // Programmatic scrolls don't always emit onMomentumScrollEnd.
      if (animated) {
        setTimeout(() => syncPanel(clamped), 280);
      } else {
        syncPanel(clamped);
      }
    },
    [syncPanel],
  );

  const armTimer = useCallback(() => {
    clearTimer();
    if (authGate) return;
    timerRef.current = setInterval(() => {
      if (draggingRef.current || completingRef.current) return;
      if (indexRef.current >= SLIDES.length - 1) {
        finish();
        return;
      }
      scrollTo(indexRef.current + 1);
    }, AUTO_ADVANCE_MS);
  }, [authGate, clearTimer, finish, scrollTo]);

  useEffect(() => {
    armTimer();
    return clearTimer;
  }, [armTimer, clearTimer]);

  const goNext = useCallback(() => {
    if (indexRef.current >= SLIDES.length - 1) {
      finish();
      return;
    }
    scrollTo(indexRef.current + 1);
    armTimer();
  }, [armTimer, finish, scrollTo]);

  const openAuthGate = useCallback(
    (kind: 'job' | 'candidate' | 'message', label: string) => {
      clearTimer();
      setAuthGate({ kind, label });
      sheetY.setValue(48);
      sheetOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [clearTimer, sheetOpacity, sheetY],
  );

  const closeAuthGate = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: 420,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setAuthGate(null);
      armTimer();
    });
  }, [armTimer, sheetOpacity, sheetY]);

  const closeAuthGateRef = useRef(closeAuthGate);
  closeAuthGateRef.current = closeAuthGate;

  const sheetPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        sheetY.stopAnimation();
        sheetOpacity.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const dy = Math.max(0, g.dy);
        sheetY.setValue(dy);
        sheetOpacity.setValue(Math.max(0.35, 1 - dy / 280));
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.dy > 90 || g.vy > 0.9;
        if (shouldClose) {
          closeAuthGateRef.current();
          return;
        }
        Animated.parallel([
          Animated.spring(sheetY, {
            toValue: 0,
            friction: 8,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.timing(sheetOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(sheetY, {
            toValue: 0,
            friction: 8,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.timing(sheetOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }),
  ).current;

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (next >= 0 && next < SLIDES.length) {
        indexRef.current = next;
        syncPanel(next);
      }
      draggingRef.current = false;
      if (!authGate) armTimer();
    },
    [armTimer, authGate, syncPanel],
  );

  const renderSlide: ListRenderItem<IntroSlide> = useCallback(
    ({ item }) => (
      <View style={styles.slide}>
        <LinearGradient colors={item.theme.gradient} style={styles.heroBleed}>
          <HeroArt slide={item} onInteract={openAuthGate} />
        </LinearGradient>
      </View>
    ),
    [openAuthGate],
  );

  const skipTone = index === 0 ? '#FFFFFF' : active.theme.deep;
  const skipBg = index === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(20, 35, 63, 0.08)';

  const gateTitle =
    authGate?.kind === 'job'
      ? 'Sign in to view this job'
      : authGate?.kind === 'message'
        ? 'Sign in to open messages'
        : 'Sign in to view this profile';

  const gateBody =
    authGate?.kind === 'job'
      ? `Create an account or log in to explore “${authGate.label}” and apply.`
      : authGate?.kind === 'message'
        ? `Log in to continue your conversation with ${authGate.label}.`
        : `Log in or sign up to open ${authGate?.label ?? 'this profile'} and connect.`;

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => finish()}
        style={[styles.skip, { top: insets.top + 10, backgroundColor: skipBg }]}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        <Text style={[styles.skipText, { color: skipTone }]}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => {
          draggingRef.current = true;
          clearTimer();
        }}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.list}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        windowSize={3}
        initialNumToRender={4}
        removeClippedSubviews={false}
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
        <ProgressDots index={index} color={active.theme.deep} />

        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslate }],
          }}
        >
          <Text style={[styles.title, { color: active.theme.deep }]}>{active.title}</Text>
          <Text style={styles.description}>{active.description}</Text>
        </Animated.View>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.ctaLabel, { color: active.theme.deep }]}>{active.cta}</Text>
        </Pressable>
      </View>

      <Modal visible={Boolean(authGate)} transparent animationType="none" onRequestClose={closeAuthGate}>
        <View style={styles.gateRoot}>
          <Pressable style={styles.gateBackdrop} onPress={closeAuthGate} />
          <Animated.View
            style={[
              styles.gateSheet,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                opacity: sheetOpacity,
                transform: [{ translateY: sheetY }],
              },
            ]}
          >
            <View style={styles.gateHandleHit} {...sheetPan.panHandlers}>
              <View style={styles.gateHandle} />
            </View>
            <View style={[styles.gateIconWrap, { backgroundColor: `${active.theme.accent}22` }]}>
              <Ionicons
                name={
                  authGate?.kind === 'job'
                    ? 'briefcase'
                    : authGate?.kind === 'message'
                      ? 'chatbubbles'
                      : 'person'
                }
                size={22}
                color={active.theme.deep}
              />
            </View>
            <Text style={[styles.gateTitle, { color: active.theme.deep }]}>{gateTitle}</Text>
            <Text style={styles.gateBody}>{gateBody}</Text>

            <Pressable
              onPress={() => finish('login')}
              style={({ pressed }) => [
                styles.gatePrimary,
                { backgroundColor: active.theme.deep },
                pressed && styles.ctaPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.gatePrimaryText}>Log in to continue</Text>
            </Pressable>

            <Pressable
              onPress={() => finish('register')}
              style={({ pressed }) => [styles.gateSecondary, pressed && styles.ctaPressed]}
              accessibilityRole="button"
            >
              <Text style={[styles.gateSecondaryText, { color: active.theme.deep }]}>
                Create an account
              </Text>
            </Pressable>

            <Pressable onPress={closeAuthGate} accessibilityRole="button">
              <Text style={styles.gateDismiss}>Not now</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F9FC',
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
    paddingTop: 48,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  heroStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stack: {
    width: '100%',
    alignItems: 'stretch',
    gap: 0,
    paddingBottom: 4,
  },
  jobCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(63,116,204,0.45)',
    backgroundColor: 'rgba(63,116,204,0.06)',
    zIndex: 2,
  },
  tapHintRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapHintText: {
    fontSize: 10,
    color: '#91A0B5',
    ...fontStyle('medium'),
  },
  gateRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gateBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 16, 28, 0.45)',
  },
  gateSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    ...theme.shadow.card,
  },
  gateHandleHit: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 16,
    marginHorizontal: -8,
  },
  gateHandle: {
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#D7DEE8',
  },
  gateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gateTitle: {
    fontSize: 22,
    letterSpacing: -0.4,
    marginBottom: 8,
    ...displayFontStyle('bold'),
  },
  gateBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6A7B92',
    marginBottom: 20,
    ...fontStyle('medium'),
  },
  gatePrimary: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gatePrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fontStyle('bold'),
  },
  gateSecondary: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F7',
    marginBottom: 8,
  },
  gateSecondaryText: {
    fontSize: 15,
    ...fontStyle('bold'),
  },
  gateDismiss: {
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 13,
    color: '#91A0B5',
    ...fontStyle('semibold'),
  },
  jobCardCompact: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoSm: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  companyLogoText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...displayFontStyle('bold'),
  },
  jobTitle: {
    fontSize: 14,
    ...displayFontStyle('bold'),
  },
  jobTitleSm: {
    fontSize: 13,
  },
  jobCompany: {
    marginTop: 2,
    fontSize: 12,
    color: '#6A7B92',
    ...fontStyle('medium'),
  },
  salaryPill: {
    backgroundColor: 'rgba(63,116,204,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  salaryText: {
    fontSize: 11,
    ...fontStyle('semibold'),
  },
  jobMeta: {
    marginTop: 10,
    fontSize: 11,
    color: '#6A7B92',
    ...fontStyle('medium'),
  },
  jobMetaInline: {
    fontSize: 10,
    color: '#91A0B5',
    marginLeft: 2,
    alignSelf: 'center',
    ...fontStyle('medium'),
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: 'rgba(20,35,63,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 10,
    ...fontStyle('semibold'),
  },
  personCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  personCardCompact: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  personTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personName: {
    fontSize: 14,
    ...displayFontStyle('bold'),
  },
  personRole: {
    marginTop: 2,
    fontSize: 12,
    color: '#6A7B92',
    ...fontStyle('medium'),
  },
  personLoc: {
    marginTop: 1,
    fontSize: 11,
    color: '#91A0B5',
    ...fontStyle('regular'),
  },
  matchPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  matchText: {
    fontSize: 10,
    ...fontStyle('semibold'),
  },
  avatarInitials: {
    color: '#FFFFFF',
    ...fontStyle('bold'),
  },
  resumeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  resumeTitle: {
    fontSize: 12,
    ...fontStyle('semibold'),
  },
  resumeSub: {
    marginTop: 2,
    fontSize: 10,
    color: '#6A7B92',
    ...fontStyle('medium'),
  },
  networkCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 14,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  networkHeading: {
    fontSize: 13,
    marginBottom: 12,
    ...displayFontStyle('bold'),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreAvatar: {
    marginLeft: -8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreAvatarText: {
    fontSize: 10,
    color: '#243B6B',
    ...fontStyle('bold'),
  },
  messagePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    padding: 12,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  messageName: {
    fontSize: 12,
    ...fontStyle('semibold'),
  },
  messageBody: {
    marginTop: 2,
    fontSize: 11,
    color: '#6A7B92',
    lineHeight: 15,
    ...fontStyle('regular'),
  },
  statPillInline: {
    alignSelf: 'center',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#0b1729',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statPillText: {
    fontSize: 12,
    ...fontStyle('semibold'),
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
    ...fontStyle('medium'),
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
