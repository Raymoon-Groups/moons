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
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { applyDefaultAppFonts } from './font-style';

// Apply defaults ASAP on web so first paint isn't system UI fonts.
if (Platform.OS === 'web') {
  applyDefaultAppFonts();
}

/**
 * Native: loads bundled Manrope + Space Grotesk.
 * Web: fonts come from @font-face in +html.tsx (same family names).
 */
export function useAppFonts() {
  const [manropeLoaded] = useManropeFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [spaceLoaded] = useSpaceGroteskFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const ready = Platform.OS === 'web' ? true : manropeLoaded && spaceLoaded;

  useEffect(() => {
    if (ready) applyDefaultAppFonts();
  }, [ready]);

  return ready;
}
