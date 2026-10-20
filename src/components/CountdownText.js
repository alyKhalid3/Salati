// src/components/CountdownText.js — the live countdown, isolated.
// One clock for the whole app: it reads the context clock. When the QA
// hook ?time=HH:MM pins the context, the digits freeze too (they agree
// with the rows and the plate instead of drifting on the wall clock).
// Unpinned (the real app), it ticks in its own state so the 1s pulse
// re-renders only the digits. Cairo's Arabic-Indic digits sit centered
// in fixed-width boxes — uniform height, zero jitter at every tick.
import React, { useState, useEffect } from 'react';
import { Animated, I18nManager, Text } from 'react-native';
import { formatCountdown } from '../utils/prayerTimes';
import { toArabicDigits } from '../utils/strings';
import { usePrayer } from '../context/PrayerContext';

// A digital clock reads left-to-right in every script — Arabic included.
// The app root runs RTL (flex rows flow right-to-left), which would mirror
// the per-char digit boxes; mirror the array back so the visual order is
// left→right on RTL surfaces, and untouched on LTR ones. Detected once:
// RN's I18nManager truth on native, the static dir attr on web.
const IS_RTL =
  (I18nManager && I18nManager.isRTL === true) ||
  (typeof document !== 'undefined' &&
    document.documentElement &&
    document.documentElement.getAttribute('dir') === 'rtl');

export default function CountdownText({ time, style, pulseOpacity }) {
  const { now: ctxNow, clockPinned } = usePrayer();
  const compute = (at) => {
    if (!time || !isValidMs(at)) return toArabicDigits('00:00:00');
    return toArabicDigits(formatCountdown(time.getTime() - timeWhere(at)));
  };
  const [text, setText] = useState(() => compute(clockPinned ? ctxNow : new Date()));
  useEffect(() => {
    if (clockPinned) {
      // Frozen QA clock — render once for the pinned moment; the context
      // re-renders if the pin itself changes, which re-runs this effect.
      setText(compute(ctxNow));
      return undefined;
    }
    if (!time) {
      setText(toArabicDigits('00:00:00'));
      return undefined;
    }
    const tick = () => setText(compute(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, clockPinned, ctxNow]);
  const raw = (text.length === 8 ? text : toArabicDigits('00:00:00'));
  const chars = IS_RTL ? raw.split('').reverse() : raw.split('');

  return (
    <Animated.View
      style={[styles.row, { opacity: pulseOpacity }]}
      accessibilityLabel={raw}
      accessibilityRole="timer"
    >
      {chars.map((ch, i) => (
        <Text
          key={`${i}-${ch}`}
          style={[
            style,
            styles.char,
            ch === ':' ? styles.colon : null,
          ]}
        >
          {ch}
        </Text>
      ))}
    </Animated.View>
  );
}

const timeWhere = (d) => d.getTime();
const isValidMs = (d) => d instanceof Date && !isNaN(d);

const styles = {
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline' },
  char: { width: 34, textAlign: 'center' },
  colon: { width: 18 },
};
