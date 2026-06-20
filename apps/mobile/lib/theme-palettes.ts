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
  background: '#f4f7fb',
  surface: '#eef2f7',
  surfaceElevated: '#ffffff',
  surfaceHover: '#e8edf5',
  border: '#d4dce8',
  borderSubtle: '#e8edf5',
  heading: '#1a2744',
  foreground: '#334155',
  muted: '#6b7a8f',
  silver: '#94a3b8',
  blue: '#4a7fd4',
  blueDark: '#3568b8',
  navy: '#1a2744',
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
  background: '#080d18',
  surface: '#111827',
  surfaceElevated: '#1a2332',
  surfaceHover: '#243044',
  border: '#2a3548',
  borderSubtle: '#1c2536',
  heading: '#f0f4f8',
  foreground: '#c8d4e3',
  muted: '#8b9cb3',
  silver: '#6b7d96',
  blue: '#6b9ae8',
  blueDark: '#4a7fd4',
  navy: '#1a2744',
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
