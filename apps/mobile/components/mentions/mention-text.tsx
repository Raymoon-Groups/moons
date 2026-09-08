import { parseMentions } from '@moons/shared';
import { router } from 'expo-router';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';

export function MentionText({
  value,
  style,
  mentionStyle,
}: {
  value: string;
  style?: StyleProp<TextStyle>;
  mentionStyle?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const segments = parseMentions(value);

  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Text key={`t-${index}`}>{segment.value}</Text>;
        }
        return (
          <Text
            key={`m-${segment.userId}-${index}`}
            style={[{ color: colors.blue, fontWeight: '600' }, mentionStyle]}
            onPress={() => router.push(`/network/${segment.userId}` as never)}
          >
            @{segment.displayName}
          </Text>
        );
      })}
    </Text>
  );
}
