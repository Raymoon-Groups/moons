import { parseMentions, splitTextWithUrls } from '@moons/shared';
import { router } from 'expo-router';
import { Linking, Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';

function openExternalUrl(href: string) {
  void Linking.openURL(href).catch(() => undefined);
}

export function MentionText({
  value,
  style,
  mentionStyle,
  linkStyle,
}: {
  value: string;
  style?: StyleProp<TextStyle>;
  mentionStyle?: StyleProp<TextStyle>;
  /** Override link appearance (e.g. white underline in outgoing bubbles). */
  linkStyle?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const segments = parseMentions(value);

  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        if (segment.type === 'mention') {
          return (
            <Text
              key={`m-${segment.userId}-${index}`}
              style={[{ color: colors.blue, fontWeight: '600' }, mentionStyle]}
              onPress={() => router.push(`/network/${segment.userId}` as never)}
            >
              @{segment.displayName}
            </Text>
          );
        }

        return splitTextWithUrls(segment.value).map((part, partIndex) => {
          const key = `t-${index}-${partIndex}`;
          if (part.type === 'text') {
            return <Text key={key}>{part.value}</Text>;
          }
          return (
            <Text
              key={key}
              style={[
                {
                  color: colors.blue,
                  fontWeight: '600',
                  textDecorationLine: 'underline',
                },
                linkStyle,
              ]}
              onPress={() => openExternalUrl(part.href)}
            >
              {part.value}
            </Text>
          );
        });
      })}
    </Text>
  );
}
