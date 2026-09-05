import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { useAuthSurface } from '@/components/auth-layout';

function useUiStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
          padding: theme.spacing.lg,
        },
        scrollContent: { flexGrow: 1 },
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: theme.spacing.lg,
          ...theme.shadow.card,
        },
        label: {
          fontSize: 13,
          fontFamily: theme.fonts.bold,
          color: colors.heading,
          marginBottom: 8,
          marginTop: 10,
        },
        input: {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: colors.foreground,
          marginBottom: 8,
          fontSize: 15,
          fontFamily: theme.fonts.regular,
        },
        inputFocused: {
          borderColor: colors.blue,
          backgroundColor: colors.surfaceElevated,
        },
        passwordWrap: {
          position: 'relative',
          marginBottom: 8,
        },
        passwordInput: {
          marginBottom: 0,
          paddingRight: 48,
        },
        eyeButton: {
          position: 'absolute',
          right: 4,
          top: 0,
          bottom: 0,
          width: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        primaryButton: {
          backgroundColor: colors.blue,
          borderRadius: theme.radius.full,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 14,
          ...theme.shadow.button,
        },
        primaryButtonSoft: {
          backgroundColor: '#EEF3FA',
          shadowColor: '#04101f',
          shadowOpacity: 0.18,
        },
        primaryButtonText: { color: '#fff', fontFamily: theme.fonts.bold, fontSize: 15, letterSpacing: 0.2 },
        primaryButtonTextSoft: { color: '#14233f' },
        secondaryButton: {
          borderRadius: theme.radius.full,
          borderWidth: 1.5,
          borderColor: colors.border,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 10,
          backgroundColor: colors.surfaceElevated,
        },
        secondaryButtonOnDark: {
          borderColor: 'rgba(255,255,255,0.22)',
          backgroundColor: 'rgba(255,255,255,0.06)',
        },
        secondaryButtonTextOnDark: { color: '#F5F8FF' },
        buttonDisabled: { opacity: 0.6 },
        buttonPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
        secondaryButtonText: { color: colors.heading, fontFamily: theme.fonts.semibold, fontSize: 15 },
        alertError: {
          marginTop: 10,
          backgroundColor: colors.errorBg,
          borderRadius: theme.radius.md,
          padding: 14,
          borderWidth: 1,
          borderColor: 'rgba(248, 113, 113, 0.28)',
        },
        alertInfo: {
          marginTop: 10,
          backgroundColor: colors.successBg,
          borderRadius: theme.radius.md,
          padding: 14,
          borderWidth: 1,
          borderColor: 'rgba(134, 239, 172, 0.28)',
        },
        error: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: theme.fonts.regular },
        info: { color: colors.success, fontSize: 14, lineHeight: 20, fontFamily: theme.fonts.regular },
        dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
        dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
        dividerLineOnDark: { backgroundColor: 'rgba(255,255,255,0.22)' },
        dividerText: { fontSize: 12, fontFamily: theme.fonts.medium, color: colors.muted },
        dividerTextOnDark: { color: 'rgba(214,224,240,0.7)' },
        link: { color: colors.blue, fontFamily: theme.fonts.bold, fontSize: 14 },
        linkOnDark: { color: '#8EB6FF' },
        labelOnDark: { color: 'rgba(245,248,255,0.82)' },
      }),
    [colors],
  );
}

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const styles = useUiStyles();
  const { colors } = useTheme();

  const content = (
    <KeyboardAvoidingView
      style={[styles.screen, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );

  if (!scroll) return content;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const styles = useUiStyles();
  return <View style={styles.card}>{children}</View>;
}

export function FieldLabel({ children }: { children: string }) {
  const styles = useUiStyles();
  const surface = useAuthSurface();
  return (
    <Text style={[styles.label, surface === 'dark' && styles.labelOnDark]}>{children}</Text>
  );
}

export function Input(props: TextInputProps) {
  const styles = useUiStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const { style, onFocus, onBlur, ...rest } = props;

  return (
    <TextInput
      {...rest}
      placeholderTextColor={colors.muted}
      style={[styles.input, focused && styles.inputFocused, style]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}

export function PasswordInput(props: Omit<TextInputProps, 'secureTextEntry'>) {
  const styles = useUiStyles();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const { style, onFocus, onBlur, ...rest } = props;

  return (
    <View style={styles.passwordWrap}>
      <TextInput
        {...rest}
        secureTextEntry={!visible}
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.passwordInput, focused && styles.inputFocused, style]}
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
        style={styles.eyeButton}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.muted}
        />
      </Pressable>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  tone = 'brand',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'brand' | 'soft';
}) {
  const styles = useUiStyles();
  const soft = tone === 'soft';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        soft && styles.primaryButtonSoft,
        (loading || disabled) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={soft ? '#14233f' : '#fff'} />
      ) : (
        <Text style={[styles.primaryButtonText, soft && styles.primaryButtonTextSoft]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useUiStyles();
  const surface = useAuthSurface();
  const onDark = surface === 'dark';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryButton,
        onDark && styles.secondaryButtonOnDark,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.secondaryButtonText, onDark && styles.secondaryButtonTextOnDark]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ErrorText({ children }: { children: string }) {
  const styles = useUiStyles();
  return (
    <View style={styles.alertError}>
      <Text style={styles.error}>{children}</Text>
    </View>
  );
}

export function InfoText({ children }: { children: string }) {
  const styles = useUiStyles();
  return (
    <View style={styles.alertInfo}>
      <Text style={styles.info}>{children}</Text>
    </View>
  );
}

export function Divider({ label = 'or continue with' }: { label?: string }) {
  const styles = useUiStyles();
  const surface = useAuthSurface();
  const onDark = surface === 'dark';
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, onDark && styles.dividerLineOnDark]} />
      <Text style={[styles.dividerText, onDark && styles.dividerTextOnDark]}>{label}</Text>
      <View style={[styles.dividerLine, onDark && styles.dividerLineOnDark]} />
    </View>
  );
}

export function LinkText({ children, onPress }: { children: string; onPress: () => void }) {
  const styles = useUiStyles();
  const surface = useAuthSurface();
  return (
    <Pressable onPress={onPress}>
      <Text style={[styles.link, surface === 'dark' && styles.linkOnDark]}>{children}</Text>
    </Pressable>
  );
}
