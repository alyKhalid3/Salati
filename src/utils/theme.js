// src/utils/theme.js - shared premium design tokens
// Monochrome + single copper accent. Extend here, never hardcode elsewhere.
export const COLORS = {
  bg: '#0a0a0a',
  elevated: '#141414',
  surface: '#1a1a1a',
  surfaceHover: '#222222',
  accent: '#d4956a',
  accentDeep: '#8a5a33',
  accentGold: '#f0d060',
  accentDim: 'rgba(212, 149, 106, 0.15)',
  accentFaint: 'rgba(212, 149, 106, 0.08)',
  accentGlow: 'rgba(212, 149, 106, 0.10)',
  hairline: 'rgba(212, 149, 106, 0.16)',
  hairlineSoft: 'rgba(240, 236, 228, 0.07)',
  text: '#f0ece4',
  textSecondary: '#8a857a',
  textMuted: '#4a4740',
};

export const FONTS = {
  arabic: 'Amiri',
  sans: 'Cairo',
};

export const RADII = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
};

export const METHOD_LABELS = {
  Egyptian: 'الهيئة المصرية للمساحة',
  MuslimWorldLeague: 'رابطة العالم الإسلامي',
  UmmAlQura: 'أم القرى',
  NorthAmerica: 'أمريكا الشمالية',
  Turkey: 'تركيا',
  Tehran: 'طهران',
  Karachi: 'كراتشي',
  Singapore: 'سنغافورة',
  Qatar: 'قطر',
  Kuwait: 'الكويت',
};

// Full dark tokens (current look). Every themed component reads these
// through context as `C` — never hardcode a color in a component.
export const DARK = {
  ...COLORS,
  surface2: '#101010',
  panel: '#050505',
  panelBorder: 'rgba(240,236,228,0.10)',
  border: '#2e2e2e',
  accentSoft: '#e8b07e',
  iconBg: '#1e1a14',
  paper: '240, 236, 228',
  scrim: 'rgba(0,0,0,0.65)',
  scrimStrong: 'rgba(0, 0, 0, 0.9)',
  textShadow: 'rgba(0, 0, 0, 0.85)',
  shadow: '#000',
};

// Daylight palette: warm ivory, same copper accent (deepened for contrast).
// Clean and minimal — restraint is the design.
export const LIGHT = {
  bg: '#f3eee1',
  elevated: '#faf6ec',
  surface: '#ffffff',
  surfaceHover: '#ece4cf',
  surface2: '#e9e0c9',
  panel: '#fffdf6',
  panelBorder: 'rgba(120, 95, 50, 0.18)',
  accent: '#b57a3e',
  accentDeep: '#8a5a33',
  accentGold: '#c1912a',
  accentSoft: '#8a5a33',
  accentDim: 'rgba(181, 122, 62, 0.14)',
  accentFaint: 'rgba(181, 122, 62, 0.07)',
  accentGlow: 'rgba(181, 122, 62, 0.12)',
  hairline: 'rgba(181, 122, 62, 0.35)',
  hairlineSoft: 'rgba(33, 27, 18, 0.08)',
  iconBg: '#efe6d2',
  border: '#ddd2b6',
  paper: '33, 27, 18',
  scrim: 'rgba(30,25,15,0.45)',
  scrimStrong: 'rgba(30, 25, 15, 0.85)',
  text: '#221b11',
  textSecondary: '#7c7060',
  textMuted: '#b5a88d',
  textShadow: 'rgba(120, 90, 40, 0.25)',
  shadow: 'rgba(120, 95, 50, 0.35)',
};

export const THEMES = { dark: DARK, light: LIGHT };

// Living atmosphere: tinted hero glows per sun phase (daylight mode).
// Same copper family, shifted with the sky — restraint, not rainbow.
export const ATMOSPHERE = {
  night:    { glow: '#d4956a', core: '#f0d060', auraA: '#d4956a', auraB: '#f0d060', o: 1.0 },
  dawn:     { glow: '#c98a7a', core: '#e0a060', auraA: '#9a6a9a', auraB: '#e0a060', o: 1.5 },
  morning:  { glow: '#d8a050', core: '#f0d060', auraA: '#d8a050', auraB: '#f0c060', o: 1.4 },
  noon:     { glow: '#e8b840', core: '#f5d060', auraA: '#e8b840', auraB: '#f5d060', o: 1.6 },
  afternoon:{ glow: '#d08a3e', core: '#e8a840', auraA: '#d08a3e', auraB: '#e8a840', o: 1.4 },
  sunset:   { glow: '#d04a2a', core: '#e09040', auraA: '#903050', auraB: '#e09040', o: 1.9 },
  dusk:     { glow: '#7a6ab0', core: '#b08090', auraA: '#7a6ab0', auraB: '#d4956a', o: 1.6 },
};
