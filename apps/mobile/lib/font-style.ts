import { Platform, type TextStyle } from 'react-native';

const nativeFonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

const nativeDisplayFonts = {
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extrabold: 'Outfit_800ExtraBold',
} as const;

const webWeights: Record<keyof typeof nativeFonts, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

const displayWebWeights: Record<keyof typeof nativeDisplayFonts, TextStyle['fontWeight']> = {
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export type FontWeight = keyof typeof nativeFonts;
export type DisplayFontWeight = keyof typeof nativeDisplayFonts;

/** Cross-platform text style — native uses loaded font files; web uses Google Fonts + fontWeight. */
export function fontStyle(weight: FontWeight): TextStyle {
  if (Platform.OS === 'web') {
    return { fontFamily: 'Plus Jakarta Sans', fontWeight: webWeights[weight] };
  }
  return { fontFamily: nativeFonts[weight] };
}

/** Modern display type — Outfit (splash / hero). */
export function displayFontStyle(weight: DisplayFontWeight = 'extrabold'): TextStyle {
  if (Platform.OS === 'web') {
    return {
      fontFamily: 'Outfit',
      fontWeight: displayWebWeights[weight],
    };
  }
  return { fontFamily: nativeDisplayFonts[weight] };
}

export const webFonts = {
  regular: 'Plus Jakarta Sans',
  medium: 'Plus Jakarta Sans',
  semibold: 'Plus Jakarta Sans',
  bold: 'Plus Jakarta Sans',
  extrabold: 'Plus Jakarta Sans',
} as const;

export const activeFontNames = Platform.OS === 'web' ? webFonts : nativeFonts;
