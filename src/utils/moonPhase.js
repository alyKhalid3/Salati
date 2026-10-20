// src/utils/moonPhase.js — the Hijri moon fraction.
// Drives the phase-accurate crescent: f = 0 → new moon (thin sliver),
// f = 0.5 → full moon, f → 1 → back to a sliver. Accuracy ±1 day is
// plenty for a glyph; the Umm al-Qura calendar via Intl is the source.
export function hijriMoonFraction(now = new Date()) {
  let day = 1;
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' });
      const parts = fmt.formatToParts(now);
      const d = parts.find((p) => p.type === 'day');
      day = Math.min(30, Math.max(1, parseInt(d ? d.value : '1', 10) || 1));
    }
  } catch (e) { /* keep day 1 */ }
  return Math.min(0.98, Math.max(0.03, (day - 0.5) / 29.5));
}
