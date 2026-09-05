import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthLegalLinks } from './auth-legal-links';
import { MoonsLogo } from './moons-logo';
import { ThemeToggle } from './theme-toggle';
import { displayFontStyle, fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export type AuthHeroVariant = 'signin' | 'signup' | 'forgot';

type AuthSurface = 'dark' | 'light';

const AuthSurfaceContext = createContext<AuthSurface>('light');

export function useAuthSurface() {
  return useContext(AuthSurfaceContext);
}

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 44;
const PANEL = '#14233f';

function TopWave({ fill }: { fill: string }) {
  // Soft dip under the white header into the navy panel
  return (
    <Svg width={SCREEN_W} height={WAVE_H} viewBox={`0 0 ${SCREEN_W} ${WAVE_H}`} style={styles.wave}>
      <Path
        d={`M0 0 C ${SCREEN_W * 0.28} ${WAVE_H * 1.15}, ${SCREEN_W * 0.62} 4, ${SCREEN_W} ${WAVE_H * 0.72} L ${SCREEN_W} ${WAVE_H} L 0 ${WAVE_H} Z`}
        fill={fill}
      />
    </Svg>
  );
}

function BottomWave({ fill }: { fill: string }) {
  return (
    <Svg width={SCREEN_W} height={WAVE_H} viewBox={`0 0 ${SCREEN_W} ${WAVE_H}`} style={styles.wave}>
      <Path
        d={`M0 0 L ${SCREEN_W} 0 L ${SCREEN_W} ${WAVE_H * 0.35} C ${SCREEN_W * 0.7} ${WAVE_H * 1.05}, ${SCREEN_W * 0.3} 8, 0 ${WAVE_H} Z`}
        fill={fill}
      />
    </Svg>
  );
}

function AuthModeToggle({ active }: { active: 'signin' | 'signup' }) {
  return (
    <View style={styles.toggleTrack}>
      <Pressable
        onPress={() => router.replace('/login')}
        style={[styles.toggleItem, active === 'signin' && styles.toggleItemActive]}
      >
        <Text
          style={[
            styles.toggleText,
            active === 'signin' ? styles.toggleTextActive : styles.toggleTextIdle,
          ]}
        >
          Login
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.replace('/register')}
        style={[styles.toggleItem, active === 'signup' && styles.toggleItemActive]}
      >
        <Text
          style={[
            styles.toggleText,
            active === 'signup' ? styles.toggleTextActive : styles.toggleTextIdle,
          ]}
        >
          Sign up
        </Text>
      </Pressable>
    </View>
  );
}

export function AuthField({
  icon,
  label,
  ...props
}: TextInputProps & { icon: keyof typeof Ionicons.glyphMap; label?: string }) {
  const surface = useAuthSurface();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const { style, onFocus, onBlur, placeholder, ...rest } = props;
  const dark = surface === 'dark';

  return (
    <View style={styles.fieldBlock}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: dark ? 'rgba(255,255,255,0.78)' : colors.muted }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.underlineField,
          {
            borderBottomColor: focused
              ? colors.blue
              : dark
                ? 'rgba(255,255,255,0.28)'
                : colors.border,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={focused ? colors.blue : dark ? 'rgba(255,255,255,0.55)' : colors.muted}
        />
        <TextInput
          {...rest}
          placeholder={placeholder}
          placeholderTextColor={dark ? 'rgba(255,255,255,0.35)' : colors.muted}
          style={[
            styles.underlineInput,
            { color: dark ? '#F5F8FF' : colors.heading },
            style,
          ]}
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
  const surface = useAuthSurface();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { style, onFocus, onBlur, placeholder, ...rest } = props;
  const dark = surface === 'dark';

  return (
    <View style={styles.fieldBlock}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: dark ? 'rgba(255,255,255,0.78)' : colors.muted }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.underlineField,
          {
            borderBottomColor: focused
              ? colors.blue
              : dark
                ? 'rgba(255,255,255,0.28)'
                : colors.border,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={focused ? colors.blue : dark ? 'rgba(255,255,255,0.55)' : colors.muted}
        />
        <TextInput
          {...rest}
          secureTextEntry={!visible}
          placeholder={placeholder}
          placeholderTextColor={dark ? 'rgba(255,255,255,0.35)' : colors.muted}
          style={[
            styles.underlineInput,
            { color: dark ? '#F5F8FF' : colors.heading },
            style,
          ]}
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
            color={dark ? 'rgba(255,255,255,0.55)' : colors.muted}
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
  const showToggle = variant === 'signin' || variant === 'signup';

  return (
    <AuthSurfaceContext.Provider value="dark">
      <View style={[styles.root, { backgroundColor: '#F3F6FB' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerRow}>
            <MoonsLogo size="lg" />
            <ThemeToggle />
          </View>
        </View>

        <TopWave fill={PANEL} />

        <KeyboardAvoidingView
          style={styles.panel}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Math.max(insets.bottom, 18) + 12 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showToggle ? (
              <AuthModeToggle active={variant === 'signup' ? 'signup' : 'signin'} />
            ) : null}

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.body}>{children}</View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>

        <BottomWave fill="#F3F6FB" />

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <AuthLegalLinks />
        </View>
      </View>
    </AuthSurfaceContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wave: {
    backgroundColor: 'transparent',
  },
  panel: {
    flex: 1,
    backgroundColor: PANEL,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 8,
    flexGrow: 1,
  },
  toggleTrack: {
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    padding: 4,
    marginBottom: 22,
    width: '100%',
    maxWidth: 280,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleItemActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 14,
    ...displayFontStyle('semibold'),
  },
  toggleTextActive: {
    color: PANEL,
  },
  toggleTextIdle: {
    color: '#8EB6FF',
  },
  title: {
    fontSize: 28,
    color: '#F5F8FF',
    textAlign: 'center',
    letterSpacing: -0.6,
    ...displayFontStyle('extrabold'),
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(214, 224, 240, 0.72)',
    textAlign: 'center',
    ...fontStyle('regular'),
  },
  body: {
    marginTop: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  bottomBar: {
    backgroundColor: '#F3F6FB',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 4,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 8,
    ...fontStyle('medium'),
  },
  underlineField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1.5,
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
  },
  underlineInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 4 : 8,
    ...fontStyle('regular'),
  },
});
