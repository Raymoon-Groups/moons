import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

const SIZES = { sm: 32, md: 40, lg: 48, xl: 56 } as const;

export function MoonsLogo({
  size = 'md',
  variant = 'default',
}: {
  size?: keyof typeof SIZES;
  variant?: 'default' | 'onDark';
}) {
  const { colors } = useTheme();
  const height = SIZES[size];
  const width = height * 2.35;

  const image = (
    <Image
      source={require('@/assets/moonsjob_logo.png')}
      style={{ height, width }}
      contentFit="contain"
    />
  );

  if (variant === 'onDark') {
    return (
      <View style={[styles.whiteBg, { backgroundColor: colors.white }]}>
        {image}
      </View>
    );
  }

  return image;
}

const styles = StyleSheet.create({
  whiteBg: {
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
});
