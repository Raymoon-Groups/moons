import { useMemo, type ReactNode } from 'react';
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
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

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
          borderRadius: theme.radius.lg,
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
          marginTop: 8,
        },
        input: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: 14,
          paddingVertical: 13,
          color: colors.foreground,
          marginBottom: 8,
          fontSize: 15,
          fontFamily: theme.fonts.regular,
        },
        primaryButton: {
          backgroundColor: colors.blue,
          borderRadius: theme.radius.full,
          paddingVertical: 15,
          alignItems: 'center',
          marginTop: 12,
        },
        secondaryButton: {
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 10,
          backgroundColor: colors.surface,
        },
        buttonDisabled: { opacity: 0.65 },
        buttonPressed: { opacity: 0.9 },
        primaryButtonText: { color: '#fff', fontFamily: theme.fonts.bold, fontSize: 15 },
        secondaryButtonText: { color: colors.heading, fontFamily: theme.fonts.semibold, fontSize: 15 },
        alertError: {
          marginTop: 8,
          backgroundColor: colors.errorBg,
          borderRadius: theme.radius.md,
          padding: 12,
          borderWidth: 1,
          borderColor: 'rgba(248, 113, 113, 0.25)',
        },
        alertInfo: {
          marginTop: 8,
          backgroundColor: colors.successBg,
          borderRadius: theme.radius.md,
          padding: 12,
          borderWidth: 1,
          borderColor: 'rgba(134, 239, 172, 0.25)',
        },
        error: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: theme.fonts.regular },
        info: { color: colors.success, fontSize: 14, lineHeight: 20, fontFamily: theme.fonts.regular },
        dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
        dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
        dividerText: { fontSize: 12, fontFamily: theme.fonts.medium, color: colors.muted },
        link: { color: colors.blue, fontFamily: theme.fonts.bold, fontSize: 14 },
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
  return <Text style={styles.label}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  const styles = useUiStyles();
  const { colors } = useTheme();
  return (
    <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const styles = useUiStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        (loading || disabled) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useUiStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
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
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function LinkText({ children, onPress }: { children: string; onPress: () => void }) {
  const styles = useUiStyles();
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.link}>{children}</Text>
    </Pressable>
  );
}
