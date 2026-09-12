import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts as useManropeFonts,
} from '@expo-google-fonts/manrope';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts as useSpaceGroteskFonts,
} from '@expo-google-fonts/space-grotesk';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { applyDefaultAppFonts } from './font-style';

// Apply defaults ASAP on web so first paint isn't system UI fonts.
if (Platform.OS === 'web') {
  applyDefaultAppFonts();
}

/** Don't leave Play Store users stuck on a blank spinner if fonts fail/hang. */
const FONT_BOOT_TIMEOUT_MS = 3500;

/**
 * Native: loads bundled Manrope + Space Grotesk.
 * Web: fonts come from @font-face in +html.tsx (same family names).
 */
export function useAppFonts() {
  const [manropeLoaded, manropeError] = useManropeFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [spaceLoaded, spaceError] = useSpaceGroteskFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const timer = setTimeout(() => setTimedOut(true), FONT_BOOT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const fontsOk =
    Platform.OS === 'web'
      ? true
      : (manropeLoaded || Boolean(manropeError)) && (spaceLoaded || Boolean(spaceError));

  const ready = fontsOk || timedOut;

  useEffect(() => {
    if (ready) applyDefaultAppFonts();
  }, [ready]);

  return ready;
}
