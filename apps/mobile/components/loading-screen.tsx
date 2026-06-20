import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/lib/theme-context';

export function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.blue} />
    </View>
  );
}
