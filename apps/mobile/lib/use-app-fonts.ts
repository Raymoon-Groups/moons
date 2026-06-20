import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const FONT_BASE =
  'https://github.com/googlefonts/plus-jakarta-sans/raw/main/fonts/ttf';

async function loadNativeFonts() {
  await Font.loadAsync({
    PlusJakartaSans_400Regular: `${FONT_BASE}/PlusJakartaSans-Regular.ttf`,
    PlusJakartaSans_500Medium: `${FONT_BASE}/PlusJakartaSans-Medium.ttf`,
    PlusJakartaSans_600SemiBold: `${FONT_BASE}/PlusJakartaSans-SemiBold.ttf`,
    PlusJakartaSans_700Bold: `${FONT_BASE}/PlusJakartaSans-Bold.ttf`,
    PlusJakartaSans_800ExtraBold: `${FONT_BASE}/PlusJakartaSans-ExtraBold.ttf`,
  });
}

/** Loads Plus Jakarta Sans on native; web uses +html.tsx Google Fonts link. */
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
