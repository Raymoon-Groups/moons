import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthLegalLinks } from './auth-legal-links';
import { displayFontStyle, fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export type AuthHeroVariant = 'signin' | 'signup' | 'forgot';

type AuthSurface = 'dark' | 'light';

const AuthSurfaceContext = createContext<AuthSurface>('light');

export function useAuthSurface() {
  return useContext(AuthSurfaceContext);
}

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.min(228, SCREEN_W * 0.56);

type HeroMotif = {
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  iconSize: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  opacity: number;
  rotate?: string;
};

const HERO_MOTIFS: HeroMotif[] = [
  { icon: 'briefcase-outline', size: 54, iconSize: 24, top: 22, right: 20, opacity: 0.88, rotate: '-8deg' },
  { icon: 'people-outline', size: 48, iconSize: 22, top: 78, right: 74, opacity: 0.76, rotate: '10deg' },
  { icon: 'business-outline', size: 44, iconSize: 20, top: 34, left: 16, opacity: 0.7, rotate: '12deg' },
  { icon: 'document-text-outline', size: 42, iconSize: 18, top: 98, left: 24, opacity: 0.62, rotate: '-6deg' },
  { icon: 'search-outline', size: 40, iconSize: 18, top: 58, left: 92, opacity: 0.58, rotate: '8deg' },
  { icon: 'ribbon-outline', size: 38, iconSize: 17, top: 110, right: 28, opacity: 0.52, rotate: '-12deg' },
];

function AuthHeroBackground() {
  const { colors } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.navy, '#1b3358', colors.blueDark]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(110,160,239,0.28)', 'transparent']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowLeft]} />
      <View style={[styles.glow, styles.glowRight]} />
      <View style={styles.orbitOuter} />
      <View style={styles.orbitInner} />

      {HERO_MOTIFS.map((motif) => (
        <View
          key={motif.icon}
          style={[
            styles.motifChip,
            {
              width: motif.size,
              height: motif.size,
              borderRadius: motif.size / 2,
              top: motif.top,
              bottom: motif.bottom,
              left: motif.left,
              right: motif.right,
              opacity: motif.opacity,
              transform: [{ rotate: motif.rotate ?? '0deg' }],
            },
          ]}
        >
          <Ionicons name={motif.icon} size={motif.iconSize} color="rgba(255,255,255,0.92)" />
        </View>
      ))}
    </View>
  );
}

export function AuthField({
  icon,
  label,
  ...props
}: TextInputProps & { icon: keyof typeof Ionicons.glyphMap; label?: string }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const { style, onFocus, onBlur, placeholder, ...rest } = props;

  return (
    <View style={styles.fieldBlock}>
      {label ? <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text> : null}
      <View
        style={[
          styles.filledField,
          {
            backgroundColor: focused ? '#EEF3FA' : '#F4F7FB',
            borderColor: focused ? 'rgba(63,116,204,0.55)' : 'transparent',
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={focused ? colors.blue : colors.muted} />
        <TextInput
          {...rest}
          placeholder={placeholder}
          placeholderTextColor={colors.silver}
          style={[styles.filledInput, { color: colors.heading }, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>
    </View>
  );
}

export function AuthPasswordField({
  icon = 'lock-closed-outline',
  label,
  ...props
}: Omit<TextInputProps, 'secureTextEntry'> & {
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { style, onFocus, onBlur, placeholder, ...rest } = props;

  return (
    <View style={styles.fieldBlock}>
      {label ? <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text> : null}
      <View
        style={[
          styles.filledField,
          {
            backgroundColor: focused ? '#EEF3FA' : '#F4F7FB',
            borderColor: focused ? 'rgba(63,116,204,0.55)' : 'transparent',
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={focused ? colors.blue : colors.muted} />
        <TextInput
          {...rest}
          secureTextEntry={!visible}
          placeholder={placeholder}
          placeholderTextColor={colors.silver}
          style={[styles.filledInput, { color: colors.heading }, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          style={styles.eyeInline}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
  variant = 'signin',
}: {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
  variant?: AuthHeroVariant;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const heroEyebrow =
    variant === 'signup' ? 'Create account' : variant === 'forgot' ? 'Password reset' : 'Welcome back';
  const cardOverlap = 48;
  const heroHeight = HERO_H + insets.top;

  return (
    <AuthSurfaceContext.Provider value="light">
      <View style={styles.root}>
        {/* Full-bleed header — white sheet overlaps this */}
        <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top }]}>
          <AuthHeroBackground />
          <View style={[styles.heroCopy, { paddingBottom: cardOverlap + 12 }]}>
            <Text style={styles.heroEyebrow}>{heroEyebrow}</Text>
            <Text style={styles.heroTitle}>MoonsJob</Text>
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* White sheet sits above the header with large top radii */}
        <KeyboardAvoidingView
          style={[styles.sheetWrap, { marginTop: -cardOverlap }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={[styles.sheet, { backgroundColor: colors.white }]}>
            <ScrollView
              contentContainerStyle={[
                styles.scroll,
                { paddingBottom: Math.max(insets.bottom, 16) + 12 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={[styles.cardTitle, { color: colors.heading }]}>{title}</Text>
              <View style={styles.titleRule} />
              <View style={styles.body}>{children}</View>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
              <View style={styles.legalWrap}>
                <AuthLegalLinks />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </AuthSurfaceContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#14233f',
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  heroCopy: {
    paddingTop: 12,
    zIndex: 1,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
    ...fontStyle('semibold'),
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    letterSpacing: -1,
    ...displayFontStyle('extrabold'),
  },
  heroSubtitle: {
    marginTop: 8,
    color: 'rgba(235,242,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
    ...fontStyle('regular'),
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowLeft: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(240, 186, 96, 0.22)',
    top: -48,
    left: -56,
  },
  glowRight: {
    width: 170,
    height: 170,
    backgroundColor: 'rgba(78, 196, 180, 0.2)',
    top: 18,
    right: -60,
  },
  orbitOuter: {
    position: 'absolute',
    width: SCREEN_W * 0.72,
    height: SCREEN_W * 0.72,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    right: -SCREEN_W * 0.22,
    bottom: -SCREEN_W * 0.28,
  },
  orbitInner: {
    position: 'absolute',
    width: SCREEN_W * 0.46,
    height: SCREEN_W * 0.46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    right: -SCREEN_W * 0.08,
    bottom: -SCREEN_W * 0.16,
  },
  motifChip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  sheetWrap: {
    flex: 1,
    zIndex: 2,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  cardTitle: {
    fontSize: 23,
    letterSpacing: -0.45,
    ...displayFontStyle('bold'),
  },
  titleRule: {
    width: 36,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#3f74cc',
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    marginTop: 14,
  },
  footer: {
    marginTop: 22,
    alignItems: 'center',
  },
  legalWrap: {
    marginTop: 20,
    marginBottom: 6,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 7,
    letterSpacing: 0.2,
    ...fontStyle('semibold'),
  },
  filledField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  filledInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    ...fontStyle('regular'),
  },
  eyeInline: {
    padding: 4,
    marginRight: -2,
  },
});
