import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveAssetUrl } from '@/lib/assets';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import type { MentionPerson } from '@/lib/use-mention-composer';

export function MentionSuggestions({
  people,
  onSelect,
}: {
  people: MentionPerson[];
  onSelect: (person: MentionPerson) => void;
}) {
  const { colors, isDark } = useTheme();
  if (!people.length) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? colors.surfaceElevated : '#fff',
          borderColor: isDark ? colors.border : 'rgba(20, 35, 63, 0.1)',
          shadowColor: colors.navy,
        },
      ]}
    >
      <Text style={[styles.hint, { color: colors.muted }]}>Mention someone in your network</Text>
      {people.map((person) => {
        const avatar = resolveAssetUrl(person.avatarUrl);
        const initial = person.fullName[0]?.toUpperCase() || '?';
        return (
          <Pressable
            key={person.userId}
            onPress={() => onSelect(person)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed
                  ? isDark
                    ? colors.surfaceHover
                    : `${colors.blue}12`
                  : 'transparent',
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: `${colors.blue}18` }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={{ color: colors.blue, fontSize: 13, ...fontStyle('bold') }}>{initial}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.name, { color: colors.heading }]} numberOfLines={1}>
                {person.fullName}
              </Text>
              {person.headline ? (
                <Text style={[styles.headline, { color: colors.muted }]} numberOfLines={1}>
                  {person.headline}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  hint: {
    fontSize: 11,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    ...fontStyle('semibold'),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 34, height: 34, borderRadius: 17 },
  name: { fontSize: 14, ...fontStyle('semibold') },
  headline: { fontSize: 12, marginTop: 1 },
});
