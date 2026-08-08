import { Ionicons } from '@expo/vector-icons';
import { Switch, StyleSheet, Text, View } from 'react-native';
import { authFetch } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { useEffect, useState } from 'react';

export function DisplayStatusToggle({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated: (profile: Profile) => void;
}) {
  const { colors, isDark } = useTheme();
  const [enabled, setEnabled] = useState(Boolean(profile.openToWork));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEnabled(Boolean(profile.openToWork));
  }, [profile.openToWork]);

  async function toggle(value: boolean) {
    setSaving(true);
    setError('');
    try {
      const saved = await authFetch<Profile>('/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({ openToWork: value }),
      });
      setEnabled(Boolean(saved.openToWork));
      onUpdated(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderColor: enabled ? `${colors.blue}44` : colors.border,
        },
        theme.shadow.soft,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: enabled ? `${colors.blue}18` : colors.surface }]}>
        <Ionicons
          name={enabled ? 'eye' : 'eye-off-outline'}
          size={18}
          color={enabled ? colors.blue : colors.muted}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[{ color: colors.heading, fontSize: 16 }, fontStyle('bold')]}>Display Status</Text>
        <Text style={[{ color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 }, fontStyle('regular')]}>
          {enabled
            ? 'Profile is accessible within the app.'
            : 'Turn on to show recruiters you are open to work.'}
        </Text>
        {error ? (
          <Text style={[{ color: colors.error, fontSize: 12, marginTop: 6 }, fontStyle('medium')]}>{error}</Text>
        ) : null}
      </View>
      <Switch
        value={enabled}
        onValueChange={(v) => void toggle(v)}
        disabled={saving}
        trackColor={{ false: colors.border, true: colors.blue }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
});
