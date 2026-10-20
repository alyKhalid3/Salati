// src/components/MoonCrescent.js — the phase-accurate crescent.
// A gold disc whose dark overlay shifts with the Hijri moon fraction:
// thin sliver near days 1–2, half-lit near day 7/22, full disc near day
// 15. The dark part keeps a faint gold hairline so the silhouette reads
// as a moon even on flat grounds.
import React from 'react';
import { Svg, Circle } from 'react-native-svg';
import { View } from 'react-native';

const litFractionOf = (f) => 4 * f * (1 - f); // 0 at ends, 1 at full

export default function MoonCrescent({ r, f, lit, dark, ring }) {
  const L = litFractionOf(f);
  const waxing = f <= 0.5;
  const dx = (waxing ? -1 : 1) * 2 * r * L;
  const D = 2 * r;
  return (
    <View style={{ width: D, height: D }}>
      <Svg width={D} height={D} viewBox={`0 0 ${D} ${D}`}>
        <Circle cx={r} cy={r} r={r - 1} fill={lit} />
        <Circle cx={r + dx} cy={r} r={r - 1} fill={dark} />
        <Circle cx={r} cy={r} r={r - 1} fill="none" stroke={ring} strokeWidth={1} opacity={0.6} />
      </Svg>
    </View>
  );
}
