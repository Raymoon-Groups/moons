import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { useAuthSurface } from '@/components/auth-layout';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function RolePicker({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <View style={baseStyles.row}>
      <RoleOption
        label="Jobseeker"
        selected={value === UserRole.CANDIDATE}
        onPress={() => onChange(UserRole.CANDIDATE)}
      />
      <RoleOption
        label="Employer"
        selected={value === UserRole.RECRUITER}
        onPress={() => onChange(UserRole.RECRUITER)}
      />
    </View>
  );
}

function RoleOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const surface = useAuthSurface();
  const onDark = surface === 'dark';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        option: {
          flex: 1,
          borderWidth: 1,
          borderColor: onDark ? 'rgba(255,255,255,0.2)' : colors.border,
          borderRadius: theme.radius.md,
          paddingVertical: 13,
          alignItems: 'center',
          backgroundColor: onDark ? 'rgba(255,255,255,0.06)' : colors.surface,
        },
        optionSelected: {
          borderColor: colors.blue,
          backgroundColor: onDark ? 'rgba(142, 182, 255, 0.18)' : 'rgba(107, 154, 232, 0.1)',
        },
        optionText: {
          fontSize: 14,
          ...fontStyle('bold'),
          color: onDark ? 'rgba(214,224,240,0.75)' : colors.muted,
        },
        optionTextSelected: {
          color: onDark ? '#F5F8FF' : colors.heading,
        },
      }),
    [colors, onDark],
  );

  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const baseStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
});
