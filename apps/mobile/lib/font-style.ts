import { Platform, Text, TextInput, type TextStyle } from 'react-native';

/**
 * Same family keys on native + web.
 * Web maps these names via @font-face in +html.tsx so
 * `fontFamily: theme.fonts.bold` actually renders bold.
 */
export const appFonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const appDisplayFonts = {
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  extrabold: 'SpaceGrotesk_700Bold',
} as const;

export type FontWeight = keyof typeof appFonts;
export type DisplayFontWeight = keyof typeof appDisplayFonts;

/** Body / UI text */
export function fontStyle(weight: FontWeight): TextStyle {
  return {
    fontFamily: appFonts[weight],
    letterSpacing: 0.2,
  };
}

/** Display / hero / page titles */
export function displayFontStyle(weight: DisplayFontWeight = 'bold'): TextStyle {
  return {
    fontFamily: appDisplayFonts[weight],
    letterSpacing: -0.35,
  };
}

/** @deprecated use appFonts — kept for theme.fonts compatibility */
export const webFonts = appFonts;
export const activeFontNames = appFonts;

/**
 * Force every Text / TextInput to use Manrope unless a style overrides fontFamily.
 */
export function applyDefaultAppFonts() {
  const base = fontStyle('regular');

  const textDefaults = (Text as unknown as { defaultProps?: { style?: unknown } }).defaultProps ?? {};
  (Text as unknown as { defaultProps: { style?: unknown } }).defaultProps = {
    ...textDefaults,
    style: [base, textDefaults.style],
  };

  const inputDefaults =
    (TextInput as unknown as { defaultProps?: { style?: unknown } }).defaultProps ?? {};
  (TextInput as unknown as { defaultProps: { style?: unknown } }).defaultProps = {
    ...inputDefaults,
    style: [base, inputDefaults.style],
  };
}
