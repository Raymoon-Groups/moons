export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  heading: string;
  foreground: string;
  muted: string;
  silver: string;
  blue: string;
  blueDark: string;
  navy: string;
  error: string;
  errorBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  white: string;
};

export const lightColors: ThemeColors = {
  background: '#eef3f9',
  surface: '#e7eef7',
  surfaceElevated: '#ffffff',
  surfaceHover: '#dfe8f4',
  border: '#cfd9e8',
  borderSubtle: '#e4ebf5',
  heading: '#14233f',
  foreground: '#2f3f56',
  muted: '#6a7b92',
  silver: '#91a0b5',
  blue: '#3f74cc',
  blueDark: '#2f5fad',
  navy: '#14233f',
  error: '#dc2626',
  errorBg: 'rgba(220, 38, 38, 0.1)',
  success: '#16a34a',
  successBg: 'rgba(22, 163, 74, 0.1)',
  warning: '#d97706',
  warningBg: 'rgba(217, 119, 6, 0.1)',
  info: '#0284c7',
  infoBg: 'rgba(2, 132, 199, 0.1)',
  white: '#ffffff',
};

export const darkColors: ThemeColors = {
  background: '#070b14',
  surface: '#101826',
  surfaceElevated: '#172133',
  surfaceHover: '#223049',
  border: '#2b3850',
  borderSubtle: '#1a2436',
  heading: '#f3f7fb',
  foreground: '#c9d5e5',
  muted: '#8c9db4',
  silver: '#6a7d96',
  blue: '#6ea0ef',
  blueDark: '#4a7fd4',
  navy: '#14233f',
  error: '#fca5a5',
  errorBg: 'rgba(248, 113, 113, 0.12)',
  success: '#86efac',
  successBg: 'rgba(134, 239, 172, 0.12)',
  warning: '#fcd34d',
  warningBg: 'rgba(252, 211, 77, 0.12)',
  info: '#7dd3fc',
  infoBg: 'rgba(125, 211, 252, 0.12)',
  white: '#ffffff',
};
