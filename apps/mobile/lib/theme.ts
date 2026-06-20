import { activeFontNames, webFonts } from './font-style';
import { darkColors } from './theme-palettes';

export const theme = {
  colors: darkColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 24,
    full: 999,
  },
  shadow: {
    card: {
      shadowColor: '#1a2744',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  },
  typography: {
    hero: 26,
    title: 22,
    subtitle: 15,
    body: 14,
    caption: 12,
    micro: 11,
  },
  fonts: {
    ...activeFontNames,
    web: webFonts,
  },
} as const;

export type { ThemeColors } from './theme-palettes';

// Back-compat alias used across the app
export const colors = theme.colors;
