import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '@moons/shared';
import { useAuthSurface } from '@/components/auth-layout';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export function RolePicker({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  const { colors } = useTheme();
  const surface = useAuthSurface();
  const onDark = surface === 'dark';

  const shell = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 4,
          marginTop: 8,
          marginBottom: 12,
          padding: 4,
          borderRadius: 14,
          backgroundColor: onDark ? 'rgba(255,255,255,0.08)' : '#EEF2F7',
        },
      }),
    [onDark],
  );

  return (
    <View style={shell.row}>
      <RoleOption
        label="Jobseeker"
        selected={value === UserRole.CANDIDATE}
        onPress={() => onChange(UserRole.CANDIDATE)}
        colors={colors}
        onDark={onDark}
      />
      <RoleOption
        label="Employer"
        selected={value === UserRole.RECRUITER}
        onPress={() => onChange(UserRole.RECRUITER)}
        colors={colors}
        onDark={onDark}
      />
    </View>
  );
}

function RoleOption({
  label,
  selected,
  onPress,
  colors,
  onDark,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  onDark: boolean;
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        option: {
          flex: 1,
          borderRadius: 11,
          paddingVertical: 11,
          alignItems: 'center',
          backgroundColor: 'transparent',
        },
        optionSelected: {
          backgroundColor: onDark ? 'rgba(142, 182, 255, 0.22)' : colors.white,
          shadowColor: '#0f1c33',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: onDark ? 0 : 0.08,
          shadowRadius: 6,
          elevation: onDark ? 0 : 2,
        },
        optionText: {
          fontSize: 13,
          ...fontStyle('semibold'),
          color: onDark ? 'rgba(214,224,240,0.7)' : colors.muted,
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
