// src/components/OrnamentRule.js — the khatam rule.
// The one repeating motif of the world: a gold hairline carrying a small
// diamond (the khatam) at its heart. Used as the section divider on every
// page. Props: C from context; `ink` overrides the diamond (window accent).
import React from 'react';
import Svg, { Line, Rect } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';

export default function OrnamentRule({ ink, width = 210, height = 12 }) {
  const { C } = usePrayer();
  const mid = width / 2;
  const diamond = 7;
  const lineW = Math.max(24, mid - 22);
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={mid - 22 - lineW} y1={height / 2} x2={mid - 12} y2={height / 2} stroke={C.accentGold} strokeWidth={1} opacity={0.65} />
      <Line x1={mid + 12} y1={height / 2} x2={mid + 12 + lineW} y2={height / 2} stroke={C.accentGold} strokeWidth={1} opacity={0.65} />
      <Rect
        x={mid - diamond / 2}
        y={height / 2 - diamond / 2}
        width={diamond}
        height={diamond}
        rx={1.4}
        fill={ink || C.accentGold}
      />
      <Rect
        x={mid - 2.4}
        y={height / 2 - 2.4}
        width={4.8}
        height={4.8}
        rx={0.8}
        fill={C.bg}
        opacity={0.9}
      />
    </Svg>
  );
}