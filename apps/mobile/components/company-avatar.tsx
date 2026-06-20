import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export function CompanyAvatar({
  name,
  size = 48,
  imageUrl,
}: {
  name: string;
  size?: number;
  imageUrl?: string | null;
}) {
  const { colors } = useTheme();
  const letter = (name.trim().charAt(0) || 'C').toUpperCase();
  const radius = size * 0.28;

  if (imageUrl) {
    return (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: colors.border,
            overflow: 'hidden',
          },
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
          accessibilityLabel={`${name} logo`}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.blue, colors.navy]}
      style={[styles.avatar, { width: size, height: size, borderRadius: radius, borderColor: colors.border }]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.38 }, fontStyle('extrabold')]}>{letter}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  letter: {
    color: '#ffffff',
  },
});
