import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState, type ReactNode } from 'react';
import {
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
import { MoonsLogo } from './moons-logo';
import { ThemeToggle } from './theme-toggle';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type AuthHeroVariant = 'signin' | 'signup' | 'forgot';

function AuthHeroArt({ variant, blue }: { variant: AuthHeroVariant; blue: string }) {
  const icon =
    variant === 'signin'
      ? 'phone-portrait-outline'
      : variant === 'signup'
        ? 'person-add-outline'
        : 'key-outline';

  return (
    <View style={heroArt.wrap}>
      <View style={[heroArt.blob, { backgroundColor: `${blue}22` }]} />
      <View style={[heroArt.ring, { borderColor: `${blue}33` }]} />
      <View style={[heroArt.card, { backgroundColor: '#fff', borderColor: `${blue}28` }]}>
        <View style={[heroArt.avatar, { backgroundColor: `${blue}18` }]}>
          <Ionicons name={icon} size={28} color={blue} />
        </View>
        <View style={heroArt.bars}>
          <View style={[heroArt.bar, { width: '70%', backgroundColor: `${blue}55` }]} />
          <View style={[heroArt.bar, { width: '48%', backgroundColor: `${blue}33` }]} />
        </View>
      </View>
      <View style={[heroArt.float, heroArt.floatLeft, { backgroundColor: '#F5C84C' }]}>
        <Ionicons name="briefcase-outline" size={14} color="#fff" />
      </View>
      <View style={[heroArt.float, heroArt.floatRight, { backgroundColor: blue }]}>
        <Ionicons name="search" size={14} color="#fff" />
      </View>
    </View>
  );
}

const heroArt = StyleSheet.create({
  wrap: {
    width: 180,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  blob: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  ring: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  card: {
    width: 112,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: { width: '100%', gap: 6 },
  bar: { height: 7, borderRadius: 4 },
  float: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatLeft: { left: 8, top: 18 },
  floatRight: { right: 4, bottom: 22 },
});

export function AuthField({
  icon,
  ...props
}: TextInputProps & { icon: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const { style, onFocus, onBlur, ...rest } = props;

  return (
    <View
      style={[
        fieldStyles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: focused ? colors.blue : colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={focused ? colors.blue : colors.muted} />
      <TextInput
        {...rest}
        placeholderTextColor={colors.muted}
        style={[fieldStyles.input, { color: colors.heading }, style]}
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
  );
}

export function AuthPasswordField({
  icon = 'lock-closed-outline',
  ...props
}: Omit<TextInputProps, 'secureTextEntry'> & { icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { style, onFocus, onBlur, ...rest } = props;

  return (
    <View
      style={[
        fieldStyles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: focused ? colors.blue : colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={focused ? colors.blue : colors.muted} />
      <TextInput
        {...rest}
        secureTextEntry={!visible}
        placeholderTextColor={colors.muted}
        style={[fieldStyles.input, { color: colors.heading }, style]}
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
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color={colors.muted}
        />
      </Pressable>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 0 : 10,
    ...fontStyle('regular'),
  },
});

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
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: isDark ? colors.background : '#eef2f8',
        },
        topBar: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: 8,
        },
        hero: {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: 28,
        },
        formArea: { flex: 1 },
        scroll: {
          paddingHorizontal: theme.spacing.md,
          flexGrow: 1,
        },
        card: {
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          ...theme.shadow.card,
        },
        title: {
          fontSize: 28,
          color: colors.heading,
          textAlign: 'center',
          marginTop: 4,
          ...fontStyle('extrabold'),
        },
        subtitle: {
          marginTop: 8,
          fontSize: 14,
          lineHeight: 20,
          color: colors.muted,
          textAlign: 'center',
          ...fontStyle('regular'),
        },
        body: { marginTop: theme.spacing.lg },
        footer: {
          marginTop: theme.spacing.lg,
          alignItems: 'center',
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(74,127,212,0.25)', 'rgba(26,39,68,0.35)', colors.background]
            : ['#d7e4f8', '#eef2f8', '#eef2f8']
        }
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <MoonsLogo size="md" />
        <ThemeToggle />
      </View>

      <View style={styles.hero}>
        <AuthHeroArt variant={variant} blue={colors.blue} />
      </View>

      <KeyboardAvoidingView
        style={styles.formArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.body}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
          <AuthLegalLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
