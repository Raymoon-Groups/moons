import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const JAKARTA_BASE =
  'https://github.com/googlefonts/plus-jakarta-sans/raw/main/fonts/ttf';

async function loadNativeFonts() {
  await Font.loadAsync({
    PlusJakartaSans_400Regular: `${JAKARTA_BASE}/PlusJakartaSans-Regular.ttf`,
    PlusJakartaSans_500Medium: `${JAKARTA_BASE}/PlusJakartaSans-Medium.ttf`,
    PlusJakartaSans_600SemiBold: `${JAKARTA_BASE}/PlusJakartaSans-SemiBold.ttf`,
    PlusJakartaSans_700Bold: `${JAKARTA_BASE}/PlusJakartaSans-Bold.ttf`,
    PlusJakartaSans_800ExtraBold: `${JAKARTA_BASE}/PlusJakartaSans-ExtraBold.ttf`,
    Outfit_500Medium: require('../assets/fonts/Outfit-Medium.ttf'),
    Outfit_600SemiBold: require('../assets/fonts/Outfit-SemiBold.ttf'),
    Outfit_700Bold: require('../assets/fonts/Outfit-Bold.ttf'),
    Outfit_800ExtraBold: require('../assets/fonts/Outfit-ExtraBold.ttf'),
  });
}

/** Loads Plus Jakarta Sans + Outfit on native; web uses +html.tsx Google Fonts link. */
export function useAppFonts() {
  const [ready, setReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;

    loadNativeFonts()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  return ready;
}
