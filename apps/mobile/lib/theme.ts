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
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    full: 999,
  },
  shadow: {
    card: {
      shadowColor: '#0f1c33',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
    },
    soft: {
      shadowColor: '#0f1c33',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    button: {
      shadowColor: '#3568b8',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  typography: {
    hero: 28,
    title: 22,
    subtitle: 15,
    body: 15,
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
