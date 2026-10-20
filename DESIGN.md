# Design — Salati (صلاتي)

<!-- impeccable:design-schema 1 · world: المحراب (The Mihrab) · user-picked round (user rejected فاخر/porcelain/soft-press directions) -->

## The world

**المحراب** — a prayer app that reads like a house of prayer, not an app skin: ivory parchment pages, deep mosque-green slabs crowned by the mihrab arch, and gold hairline ornaments as the only jewelry. The lineage is the prayer hall: green carpet, gold calligraphy, painted arches. It refuses the gradient-sky glass prayer app (Muslim Pro-class) and the neumorphic/porcelain worlds the user rejected.

## The four pages

The app is paged — bottom tab bar, built in `App.js` as a custom crossfade `TabShell` (no navigation dependency):

1. **الرئيسية (Home)** — the mihrab-arch hero: deep-green slab (dome top, radius clamped to width/2), gold inner frame riding the arch curve in parallel (`archFrame` inset 5), gold crescent at the crown, hijri + phase chips, the next prayer name in Amiri, and countdown digits in gold on a green recess panel with the duration band. Then the verse slab. Nothing else lives here.
2. **المواقيت (Times)** — the sun-path plate, the six slips with their state machine, the calculation meta line.
3. **التقدم (Progress)** — the gold-framed tally slab (three Amiri numbers + the last-seven-days dots) and one key per prayer with its own chain.
4. **الإعدادات (Settings)** — raised sections, green+gold option chips, gold-thumbed toggles.

`src/components/TabBar.js` — ivory bar, gold hairline frame, drawn stroke icons (mihrab arch, clock, steps, gear); the living page wears a green pill with gold ink. RTL order: home first from the right.

## Mechanism

The sun drives everything. `PrayerContext` computes `isDaytime` from the location's sunrise/maghrib and derives the theme: **light = parchment-day** (`#f6f1e6`), **dark = the mosque under a low lamp** (`#0d1713`, green-lamp dark — never charcoal). `ATMOSPHERE` maps each `getDayPhase` family to hero tint accents; the hero slab itself stays green in both themes.

## Pigments (`GLAZES` in `src/utils/theme.js`)

One Islamic pigment per prayer window — the dot on each slip, the sun-path stroke, and the slab accents:

| Window | Pigment | Ink |
| --- | --- | --- |
| الفجر | سماوي (sky) | `#6f9fb8` |
| الشروق | ذهبي (kiln gold) | `#b08c3f` |
| الظهر | لازوردي (lapis) | `#3f6db4` |
| العصر | ياقوتي خضر (jade) | `#5f9276` |
| المغرب | بولي (bole terracotta) | `#c96f4e` |
| العشاء | بنفسجي (violet) | `#8a6fb4` |

## The state grammar (PrayerRow)

- **Asleep (locked/future)** — flat ivory slip, pigment dot with a dashed ring, no صليت key at all (nobody marks a prayer that hasn't come). The *next* prayer keeps full opacity; farther locked rows dim to 0.55.
- **The window (current, unmarked)** — deep-green face, gold edge, on-green name, gold time, filled green key.
- **Prayed** — struck name (coral dotted strike), gold ✓ check in a hairline key, face settles back to ivory.
- On the sun-path plate: passed windows wear solid pigment dots, upcoming windows hollow dashed rings, and the sun marker a gold-rimmed dot.

## Ornament law

- One repeating motif: the **khatam rule** (`OrnamentRule.js`) — a gold hairline carrying a small gold diamond. It divides every page's sections.
- Cards: ivory/parchment surface + gold hairline frame (`goldFaint`) + one soft drop shadow (`raise`/`raiseSm`). Never neon glows, never multi-layer neumorphic pairs.
- The hero slab stays green; the sun phase surfaces through the phase chip (glyph + label) and the sun-path plate. The `ATMOSPHERE` table remains in `theme.js` as dormant token data (one accent per phase) for future per-phase touches — nothing renders from it today.
- Radii: 16 for slabs/cards, 12–14 for keys/chips; the hero's dome clamps automatically; the inner gold frame is inset 5 (`RULES.archFrameInset`) so it rides the arch as a parallel curve.
- Letter-spacing is forbidden on Arabic strings (it breaks Cairo/Amiri ligatures).
- Arabic-Indic digits everywhere (`toArabicDigits`); streak/stat numbers set in **Amiri** so `٠` renders as a proper ring, not a Cairo dot.

## The logo (paper-cut identity)

Chosen mark (user pick «٢٨ — القمر الخاتم على الكتف»): a **deep-green dome on its mid-green paper band, gold crescent docked on the shoulder**, on an all-ivory field — paper-cut language: 2–3 flat cut shapes, one warm `feDropShadow` per shape (`#7a6a4f @ 0.32`, dy 5, blur 6 in the 240-unit space), no outlines.

- **Master geometry lives in the 240-unit viewBox** (`.impeccable/logo-export/*.html`):
  - band `rect(56,160,128,13,rx 6.5)` `#5c9679` · dome `M 56 168 A 58 55 0 0 1 172 168 Z` `#0f5d43` · crescent a real path (no bg-colored cutter, so it survives transparency): `M 152.15 91.67 A 18 18 0 1 1 175.82 111.03 A 16 16 0 0 0 152.15 91.67 Z` `#c9a253` — the inner arc's sweep is **0** (sweep 1 renders a full disc; verified both ways).
  - `icon.png` = mark scaled ×1.4 about (120,121) on ivory `#f6f1e6`, 1024². `adaptive-icon.png` = ×0.9 about (120,122), **transparent** (safe circle d≈66%). `favicon.png` = 48². All rasterized with Edge headless: `msedge --headless=new --disable-gpu --window-size=N,N --screenshot=… file:///…/icon.html`.
  - `app.json`: splash + adaptiveIcon backgroundColor `#f6f1e6`, notifications plugin color `#0f5d43` (was `#0a0a0a` from the pre-محراب era). Splash lives in the `expo-splash-screen` **plugin block** (SDK 54 dropped the top-level `splash` field). The Android notification small icon is a dedicated **white silhouette on transparency** (`assets/notification-icon.png` — the full-bleed icon shows as a colored blob in the shade).
  - **Native sync law**: `android/` is a committed prebuild output. After ANY `app.json` native change (icons, colors, plugins), run `npx expo prebuild --platform android --clean`, else a build compiles the stale tree. `expo-doctor`'s "app config not synced" check is this reminder, not a value mismatch.(Build recipe: Edge headless `--default-background-color=00000000` for any asset needing alpha — without it, headless screenshots bake opaque white. Verified via System.Drawing alpha probes.)
  - Concept sheets kept for history: `.impeccable/logo-sheet{,-2,-3,-4,-5}.html`.
- **In-app wordmark mark** (`HomeScreen` top bar, 18×13.7 `react-native-svg`, viewBox `5.2 7.2 13.8 10.5`): same geometry ÷10, colors from the themed token set `C` (`C.green` dome, `C.accentGold` band/crescent) so it follows day/night automatically; no shadow at this size.

## Type

**Amiri** carries display — the wordmark, prayer names, page titles, verse, tallies. **Cairo** carries labels, body, and the countdown (uniform-height Arabic-Indic digits in fixed-width boxes 34/18, so the per-second tick never jitters — trick verified via DOM).

## Strings

All UI copy lives in `src/utils/strings.js` (`S` + `toArabicDigits`) — Arabic-first, English-ready. Screens never inline copy (the only legacy inline titles: the settings header + congratulations pool, tracked as debt).

## Dev inspection hooks

`?day=0|1` and `?phase=night|dawn|morning|noon|afternoon|sunset|dusk` force theme/atmosphere, and `?time=HH:MM` **pins the whole app clock** — rows, current/next prayer, windows, the plate's sky, the gold stamp, and the hero countdown (`CountdownText` reads the context clock, so its digits also freeze and agree with the plate) — so every page agrees on one frozen hh:mm (web QA only; the interval stops while pinned). Inert in production builds; remove before a release build if desired. One QA footgun: the profile's stored location is what the times are computed for — check `الإعدادات → الإحداثيات` when numbers look unfamiliar (a leftover preset city was once mistaken for a calculation bug).

## The living sky (2026-10 additions)

- **Sun-path plate** — a shaded golden sun (radial body, offset highlight, breathing ray corona) rises as a half-disc from the horizon during the fajr window with a warm horizon glow, travels the day curve, and sinks behind maghrib with a fading glow; at night the marker becomes a kepshé crescent with its star, over a twinkling field of gold dots and khatams (`DayArc.js`, two layered SVGs; all coordinates handpicked, never randomized per render).
- **The arch's sky** (`HomeScreen`) — at night a small gold star field lives inside the mihrab dome (it breathes with the countdown pulse); during the dawn/sunset phases a gilded sliver glows at the crown.
- **Phase-accurate crescent** — the hero crown uses `MoonCrescent` (`moonPhase.js` Hijri fraction): sliver → half → full through the lunar month.
- **The gold khatam stamp** (PrayerRow) — pressing صليت presses a gold khatam ring into the slip (scale 2.4→1, hold, lift away) before the struck state settles.
- **Friday accent** — on الجمعة the hero wears a gold «جمعة مباركة» khatam chip next to the hijri chip.

## Notifications

Unified `src/utils/notifications.js`: **native** = real `expo-notifications` schedules (content-tagged with `prayer` + `day`, so cancellation is day-scoped and survives restarts; Android channel `أوقات الصلاة`); **web** = `setTimeout` timers keyed `dayKey_prayer_*` with a browser Notification when permitted, else an in-app toast — the toast copies the banner card's material law (radius 16, `surface` fill, `goldFaint` hairline, the theme's `raise` shadow, Cairo, RTL, title+body) and **follows the sun**: `PrayerContext` publishes the active world to `window.__salatiTheme`, the toast reads it at each fire. Each prayer gets a «بعد ١٠ دقائق» warning, an on-time alert, and steady 10-min reminders up to an hour.

Lifecycle rules (verified in browser):
- **Arming happens at home-mount/every settings change** — deliberately NOT via `InteractionManager.runAfterInteractions`: the hero's `Animated.loop` pulse never ends and starves that queue forever, which silently skipped *every* schedule pass (notifications never armed at all — the original «notifications don't work»).
- **Marking «صليت» cancels that prayer's pending timers for that day** (tomorrow's keep working); un-marking re-arms future-only timers (expired ones stay dead).
- The schedule pass skips prayers already marked `completed` for today, so periodic re-arms don't resurrect reminders of prayed prayers (entry objects are truthy even when `completed:false` — always test `.completed`).
- The «فعّل التنبيهات» banner shows only when notifications are disabled *or* permission was never explicitly asked (`default`); it was once rendered unconditionally (state written, never read).

## Known debts

- Native (APK) builds render system Arabic fonts — Amiri/Cairo were never registered natively (pre-existing). Fix: `expo-font` config plugin + font files + prebuild, at a moment when regenerating `android/` is safe.
- `app.json` `userInterfaceStyle: "dark"` predates the sun-following theme; consider `"light"` so system chrome agrees with the daylight theme.
- CongratulationsModal visual was code-reviewed + token-updated but not interactively triggered (future prayers are locked, by design).
- Tab accessibility: items carry `accessibilityRole="tab"` + `selected` state, but the a11y snapshot reports `selected=false` on all four — likely needs a `tablist` parent wrapper (purely semantic; the visual + hit behavior are correct).
- The settings screen and congratulations modal keep a few legacy inline Arabic strings (pre-strings.js debt).
- `expo-blur` remains an unused dependency (the porcelain world's glass idea was dropped).
