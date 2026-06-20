import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';

export function ProfileRing({
  percent,
  name,
  avatarUrl,
  logoUrl,
  size = 88,
}: {
  percent: number;
  name: string;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  size?: number;
}) {
  const { colors } = useTheme();
  const stroke = 4;
  const radius = (size - stroke) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const inner = size - 16;
  const letter = (name.trim().charAt(0) || 'U').toUpperCase();
  const imageUrl = logoUrl || avatarUrl;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.blue}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: colors.surfaceElevated,
        }}
      >
        {imageUrl ? (
          <Image
            key={imageUrl}
            source={{ uri: imageUrl }}
            style={{ width: inner, height: inner }}
            contentFit="cover"
            recyclingKey={imageUrl}
            accessibilityLabel={`${name} profile photo`}
          />
        ) : (
          <LinearGradient
            colors={[colors.blue, colors.navy]}
            style={{
              width: inner,
              height: inner,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: inner * 0.36, ...fontStyle('extrabold'), color: colors.white }}>
              {letter}
            </Text>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

