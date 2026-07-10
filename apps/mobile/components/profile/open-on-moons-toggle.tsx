import { Switch, StyleSheet, Text, View } from 'react-native';
import { authFetch } from '@/lib/api';
import {
  OPEN_ON_MOONS_DESCRIPTION,
  OPEN_ON_MOONS_LABEL,
  OPEN_ON_MOONS_TAGLINE,
} from '@/lib/open-on-moons';
import type { Profile } from '@/lib/types';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';
import { useState } from 'react';

export function OpenOnMoonsToggle({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated: (profile: Profile) => void;
}) {
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(Boolean(profile.openToWork));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <View style={[styles.icon, { backgroundColor: `${colors.blue}18` }]}>
              <Text style={[{ color: colors.blue, fontSize: 14 }, fontStyle('bold')]}>M</Text>
            </View>
            <Text style={[{ color: colors.heading, fontSize: 16 }, fontStyle('bold')]}>{OPEN_ON_MOONS_LABEL}</Text>
          </View>
          <Text style={[{ color: colors.blue, fontSize: 13, marginTop: 8 }, fontStyle('semibold')]}>
            {OPEN_ON_MOONS_TAGLINE}
          </Text>
          <Text style={[{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, fontStyle('regular')]}>
            {OPEN_ON_MOONS_DESCRIPTION}
          </Text>
          {enabled ? (
            <View style={[styles.activePill, { backgroundColor: `${colors.blue}12` }]}>
              <Text style={[{ color: colors.blue, fontSize: 11 }, fontStyle('semibold')]}>
                Visible to recruiters on Moons
              </Text>
            </View>
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
      {error ? (
        <Text style={[{ color: colors.error, fontSize: 12, marginTop: 10 }, fontStyle('medium')]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
