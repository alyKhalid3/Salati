# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Practicing Muslims in Egypt and the MENA region who pray daily and open the app in short glances several times a day: after waking (fajr window), around midday (dhuhr/asr), before maghrib, and at bedtime (isha). The phone is unlocked for a few seconds at a time; the app must be readable at a glance, in daylight and at night.

## Product Purpose

Salati (صلاتي) shows the five prayer times plus sunrise, fully offline, computed on-device from astronomy (no API). Success is: the user checks the next prayer and countdown in seconds, marks each prayer as prayed (صليت), keeps streaks alive, and receives reminder notifications without a network connection.

## Positioning

Every calculation happens on-device with pure astronomy (sun declination, Equation of Time) — a prayer app that works on a plane, in a desert, with zero data. Its living theme follows the sun at the user's location: the screen's atmosphere tracks the sky so the time of day is felt, not just read.

## Operating Context

- Arabic UI, full RTL layout. Readers' primary glance target: the countdown to the next prayer and the prayer list.
- Typical context: bright midday outdoor sun (Egypt/MENA) for dhuhr/asr, dark bedrooms or evening rooms for isha/fajr. Both extremes must stay legible.
- Mental model from established apps (Muslim Pro, Athan, etc.) — but this product's edge is atmosphere + offline truth, not feature volume.

## Capabilities and Constraints

- Expo ~54, React Native 0.81, React 19. Ships Android (native project committed, EAS + local APK builds), iOS, and web from one RN codebase. The design language is one custom RN system — no per-OS visual split.
- Prayer times: per-prayer marking, streaks (per-prayer + daily), inheritance/undo across midnight rollover.
- Local notifications with recurring reminders while unmarked; cancels on mark.
- GPS + 38 preset cities with Egyptian / Umm al-Qura / MWL calculation methods; madhab (Shafi/Hanafi Asr).
- Hijri date display; sun-phase atmosphere (dawn/noon/sunset/dusk/night).
- **Language constraint (confirmed): Arabic-first, English-ready.** UI copy stays Arabic RTL now, but all strings must live in a centralized strings module (`src/utils/` pattern) so an EN toggle can be added later. Do not hardcode copy inline in screens going forward. (Current screens hardcode inline; the redesign migrates copy out as it is touched. undecided: whether an actual EN toggle ships this redesign.)

## Brand Commitments

- Product name: Salati (صالاتي rendered صلاتي) — Arabic pronunciation, must keep its Arabic name unpunished by Latin typography overrides.
- Existing icon (`assets/icon.png`) remains until the user replaces it.
- Color palette and fonts are NOT bound commitments — the user finds the current look boring and has ordered a visual replacement.

## Evidence on Hand

- Zero authored photography or illustration assets today. The app draws its own SVG (DayArc sun path). No icon system beyond inline SVG paths.
- Message content pool (Quranic verses / hadith / motivation) exists in `src/utils/messages.js` — real content, remain in use.
- No testimonials, no press, no benchmark claims. Nothing on hand may be fabricated as real.

## Product Principles

1. Glance-first: the next prayer + countdown must land in under 3 seconds, at arm's length, without reading.
2. The screen is honest to the sky: time of day must be felt through the design, never faked or flattened (the mechanism the user explicitly ordered to keep).
3. Calm, premium, restrained: prayer is a devotional context — visual noise, aggressive gamification, and hype are out of character.
4. Arabic calligraphy and typography quality is a feature, not decoration.

## Accessibility & Inclusion

- Full RTL is mandatory; any new component must mirror correctly in RTL.
- Time displays must stay high-contrast against atmospheric backgrounds (outdoor dhuhr glare + night readability).
- Text scaling: RN `fontSize` respects system settings; verify glass surfaces with large accessibility font sizes.
