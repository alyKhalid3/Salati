// src/utils/theme.js — the «المحراب» world law.
//
// DIRECTION CONTRACT (every component reads from here; screens never hardcode):
// THESIS: a prayer app that feels like a houkh of a mosque in Zakho —
// ivory parchment pages, deep mosque-green slabs crowned by the mihrab
// arch, gold hairline frames and a small khatam ornament unit as the one
// repeating motif. Color lives in narrow bands: green structure, gold
// legibility, and each prayer window's pigment as an accent.
// MATERIAL LAW: cards are smooth ivory paper with a single soft drop
// shadow; the green slabs and gold frames carry the identity.
// RADIUS LAW: cards 16, keys 12–14, the hero arch = full dome (radius
// clamped to width half) with a gold finial.

// Page pigments — one Islamic pigment per prayer window. `ink` = the dot
// and the band fill; `washDay`/`washNight` = an active-row face tint;
// `aura` = the sun-marker fill on the sun-path plate.
export const GLAZES = {
  fajr:    { label: 'فجر',   ink: '#6f9fb8', washDay: '#e2ecf1', washNight: '#18262e', aura: '#9fc6da' },
  sunrise: { label: 'شروق',  ink: '#b08c3f', washDay: '#f2ead2', washNight: '#2c2515', aura: '#dbb968' },
  dhuhr:   { label: 'ظهر',   ink: '#3f6db4', washDay: '#dde6f2', washNight: '#1b2840', aura: '#7f9fd1' },
  asr:     { label: 'عصر',   ink: '#5f9276', washDay: '#ddecdd', washNight: '#192821', aura: '#8ab797' },
  maghrib: { label: 'مغرب',  ink: '#c96f4e', washDay: '#f0ddce', washNight: '#31201a', aura: '#e69e7e' },
  isha:    { label: 'عشاء',  ink: '#8a6fb4', washDay: '#e6ddf2', washNight: '#221d33', aura: '#b097d7' },
};

// Structure rules.
export const RULES = {
  hairline: 1,          // the only true line weight
  archFrameInset: 5,    // gold inner frame offset inside the green slab
  band: 7,              // progress band height
};

// Radii law — 16 for slabs/cards, 12–14 for keys.
export const RADII = { sm: 12, md: 14, lg: 16, xl: 18 };

// The daylight page — ivory parchment, mosque-green, gold.
// Keep token names stable; components consume C.* only.
const LIGHT = {
  bg: '#f6f1e6',
  surface: '#fbf7ed',
  panel: '#fbf7ed',
  elevated: '#fbf7ed',
  surface2: '#efe8d8',

  text: '#22312b',
  textSecondary: '#5b6a61',
  textMuted: '#93a19a',

  // The mosque-green: structure, hero slab, filled key.
  green: '#0f5d43',
  greenDeep: '#0a4a36',
  greenLift: '#14775a',   // pressed/lift tumm of green
  onGreen: '#f3ecdc',
  onGreenMuted: '#c8d4c9',

  accent: '#0f5d43',
  accentDim: 'rgba(15, 93, 67, 0.14)',
  accentGlow: 'rgba(15, 93, 67, 0.28)',
  accentFaint: 'rgba(15, 93, 67, 0.09)',

  accentGold: '#c9a253',
  goldBright: '#e0bd72',
  goldFaint: 'rgba(201, 162, 83, 0.18)',

  danger: '#c0503a',
  scrim: 'rgba(24, 34, 29, 0.42)',
  scrimStrong: 'rgba(14, 22, 18, 0.62)',
  hairline: 'rgba(34, 49, 43, 0.16)',
  hairlineSoft: 'rgba(34, 49, 43, 0.08)',

  // Elevation: one soft ambient drop (multiple on the hero arch).
  raise: '0px 10px 24px 0px rgba(26, 46, 38, 0.10), 0px 3px 8px 0px rgba(26, 46, 38, 0.07)',
  raiseSm: '0px 5px 14px 0px rgba(26, 46, 38, 0.10)',
  press: 'none',
  pressSm: 'none',
  groove: 'inset 0px 1px 3px 0px rgba(26, 46, 38, 0.14)',
  shadow: '#16352a',
  shadowLight: '#ffffff',
  shadowDark: 'rgba(26, 46, 38, 0.55)',
};

// The night page — the mosque under a low lamp: green-lamp dark, warm.
const DARK = {
  bg: '#0d1713',
  surface: '#122018',
  panel: '#122018',
  elevated: '#14231b',
  surface2: '#1b2c22',

  text: '#eadfc6',
  textSecondary: '#a8b5a8',
  textMuted: '#6f7f74',

  green: '#124b3a',
  greenDeep: '#0d3a2d',
  greenLift: '#19624c',
  onGreen: '#eee6d2',
  onGreenMuted: '#9fb5a6',

  accent: '#8fc3a8',
  accentDim: 'rgba(84, 140, 116, 0.16)',
  accentGlow: 'rgba(84, 140, 116, 0.3)',
  accentFaint: 'rgba(84, 140, 116, 0.1)',

  accentGold: '#d9b869',
  goldBright: '#e8c97e',
  goldFaint: 'rgba(217, 184, 105, 0.16)',

  danger: '#d46a52',
  scrim: 'rgba(4, 10, 8, 0.5)',
  scrimStrong: 'rgba(2, 6, 5, 0.7)',
  hairline: 'rgba(234, 223, 198, 0.15)',
  hairlineSoft: 'rgba(234, 223, 198, 0.07)',

  raise: '0px 10px 26px 0px rgba(0, 0, 0, 0.45), 0px 3px 8px 0px rgba(0, 0, 0, 0.3)',
  raiseSm: '0px 5px 14px 0px rgba(0, 0, 0, 0.38)',
  press: 'none',
  pressSm: 'none',
  groove: 'inset 0px 1px 3px 0px rgba(0, 0, 0, 0.4)',
  shadow: '#050806',
  shadowLight: '#1d2e25',
  shadowDark: 'rgba(0, 0, 0, 0.7)',
};

export const COLORS = { ...LIGHT };

export const THEMES = { dark: DARK, light: LIGHT };

// Atmosphere per sun phase — same keys getDayPhase() returns.
// The hero slab stays GREEN; the phase shows in the chip dot, the window
// ring, and the band fill. `tint` = a whisper of the window's pigment in
// the arch crown ornament. `tintNight` for dark firings.
export const ATMOSPHERE = {
  night:     { glow: '#12352a', core: '#12513f', auraA: '#0f2c22', auraB: '#12352a', tint: '#2c2515', tintNight: '#2c2515', o: 1.0 },
  dawn:      { glow: '#6f9fb8', core: '#9fc6da', auraA: '#8fc2d6', auraB: '#6f9fb8', tint: '#6f9fb8', tintNight: '#1d2e38', o: 1.0 },
  morning:   { glow: '#b08c3f', core: '#dbb968', auraA: '#cbab5c', auraB: '#b08c3f', tint: '#b08c3f', tintNight: '#2e2918', o: 1.0 },
  noon:      { glow: '#3f6db4', core: '#7f9fd1', auraA: '#6f92c6', auraB: '#3f6db4', tint: '#3f6db4', tintNight: '#1b2840', o: 1.0 },
  afternoon: { glow: '#5f9276', core: '#8ab797', auraA: '#7caa8a', auraB: '#5f9276', tint: '#5f9276', tintNight: '#192821', o: 1.0 },
  sunset:    { glow: '#c96f4e', core: '#e69e7e', auraA: '#dd8f6f', auraB: '#c96f4e', tint: '#c96f4e', tintNight: '#31201a', o: 1.0 },
  dusk:      { glow: '#8a6fb4', core: '#b097d7', auraA: '#9f87c8', auraB: '#8a6fb4', tint: '#8a6fb4', tintNight: '#221d33', o: 1.0 },
};

export const FONTS = {
  sans: 'Cairo',   // interface face — labels, body, digits
  arabic: 'Amiri', // display: prayer names, verse, the wordmark
};

// Type steps.
export const TYPE = {
  hero: 44,     // countdown digits (fixed-width boxes 34/18 proven)
  display: 38,  // prayer name (Amiri)
  prayer: 19,   // row title
  label: 12,
  micro: 10.5,
};

// Method names on panels.
export const METHOD_LABELS = {
  Egyptian: 'الهيئة المصرية العامة للمساحة',
  MuslimWorldLeague: 'رابطة العالم الإسلامي',
  UmmAlQura: 'جامعة أم القرى (مكة)',
  NorthAmerica: 'رابطة أمريكا الشمالية (ISNA)',
  Turkey: 'الديانة التركية',
  Tehran: 'طهران',
  Karachi: 'كراتشي',
  Singapore: 'سنغافورة',
  Qatar: 'قطر',
  Kuwait: 'الكويت',
};
