// src/components/DayArc.js — the living sky over the sun-path plate.
// The day drawn on parchment: a dotted horizon, the mosque silhouette,
// one pigment dot per prayer, and the traveled curve stroked in the next
// window's ink. Above the horizon lives the sky the user asked for:
//   — a shaded golden sun (offset highlight + radial body, ray corona
//     that breathes) which RISES half-disc from the horizon at fajr,
//     travels the day curve, and sinks behind maghrib;
//   — at night a kepshé crescent with its little star, and a star field
//     (dots + khatam diamonds) that twinkles;
//   — warm horizon glows during the fajr and maghrib windows.
// Two SVG layers share one box; the second layer's opacity breathes.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Svg, Path, Circle, Line, Rect, G, Mask, Defs, ClipPath, RadialGradient, Stop } from 'react-native-svg';
import { formatCountdown, formatTime } from '../utils/prayerTimes';
import { S, toArabicDigits } from '../utils/strings';
import { GLAZES } from '../utils/theme';

// Deterministic star field — handpicked, never re-randomized per render.
const STARS_A = [ // steady braid
  { x: 36, y: 24, r: 1.3 }, { x: 88, y: 42, r: 1.1 }, { x: 140, y: 20, r: 1.5 },
  { x: 196, y: 32, r: 1.1 }, { x: 248, y: 22, r: 1.4 }, { x: 292, y: 42, r: 1.2 },
  { x: 58, y: 58, r: 1.0 }, { x: 160, y: 84, r: 1.2 }, { x: 262, y: 86, r: 1.1 },
];
const STARS_B = [ // breathing subset
  { x: 120, y: 56, r: 1.6 }, { x: 232, y: 58, r: 1.5 }, { x: 96, y: 80, r: 1.3 },
  { x: 210, y: 82, r: 1.2 }, { x: 16, y: 70, r: 1.3 }, { x: 304, y: 66, r: 1.3 },
];
const KHATAMS_B = [ { x: 70, y: 30, s: 5.2 }, { x: 172, y: 40, s: 6 }, { x: 254, y: 62, s: 5 } ];

function SunRays({ cx, cy, color, clip = false }) {
  // Nine rays of alternating reach — the corona.
  return (
    <G clipPath={clip ? 'url(#arcHorizonClip)' : undefined}>
      {Array.from({ length: 9 }, (_, i) => {
        const long = i % 2 === 0;
        const a = (Math.PI * 2 * i) / 9;
        return (
          <Line
            key={i}
            x1={cx + (long ? 13 : 11.5) * Math.cos(a)}
            y1={cy + (long ? 13 : 11.5) * Math.sin(a)}
            x2={cx + (long ? 18.5 : 16) * Math.cos(a)}
            y2={cy + (long ? 18.5 : 16) * Math.sin(a)}
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        );
      })}
    </G>
  );
}

function DayArc({ fajr, sunrise, dhuhr, asr, maghrib, isha, now, timezone, C, nextName }) {
  const pulse = useRef(new Animated.Value(0.62)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.62, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const W = 320, H = 132, cy = 98, X0 = 26, X1 = 294, DAY_H = 80, NIGHT_D = 22;
  const valid = (t) => (t instanceof Date) && !isNaN(t);
  if (!(valid(sunrise) && valid(maghrib))) return null;
  const total = maghrib.getTime() - sunrise.getTime();
  if (!(total > 0)) return null;
  const spanStart = valid(fajr) && fajr.getTime() < sunrise.getTime() ? fajr : sunrise;
  const spanEnd = valid(isha) && isha.getTime() > maghrib.getTime() ? isha : maghrib;
  const span = spanEnd.getTime() - spanStart.getTime();
  if (!(span > 0)) return null;
  const X = (t) => X0 + (X1 - X0) * ((t.getTime() - spanStart.getTime()) / span);
  const Y = (t) => {
    const ms = t.getTime();
    if (ms >= sunrise.getTime() && ms <= maghrib.getTime()) {
      return cy - DAY_H * Math.sin(Math.PI * (ms - sunrise.getTime()) / total);
    }
    if (ms < sunrise.getTime() && valid(fajr) && ms >= fajr.getTime()) {
      const u = (ms - fajr.getTime()) / (sunrise.getTime() - fajr.getTime());
      return cy + NIGHT_D * Math.sin(Math.PI * u);
    }
    if (ms > maghrib.getTime() && valid(isha) && ms <= isha.getTime()) {
      const u = (ms - maghrib.getTime()) / (isha.getTime() - maghrib.getTime());
      return cy + NIGHT_D * Math.sin(Math.PI * u);
    }
    return cy;
  };
  const N = 64;
  let d = '';
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const t = new Date(spanStart.getTime() + (span * i) / N);
    const x = X(t), y = Y(t);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    pts.push({ x, y });
  }
  const nowMs = now.getTime();
  const clampedNow = Math.min(Math.max(nowMs, spanStart.getTime()), spanEnd.getTime());
  const fNow = (clampedNow - spanStart.getTime()) / span;
  const fi = fNow * N;
  const i0 = Math.min(N - 1, Math.floor(fi));
  let fillLen = 0;
  for (let i = 1; i <= i0; i += 1) fillLen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  let plen = 0;
  for (let i = 1; i <= N; i += 1) plen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const raw = (nowMs - sunrise.getTime()) / total;
  const nowT = new Date(Math.min(Math.max(nowMs, spanStart.getTime()), spanEnd.getTime()));
  const sunXNow = X(nowT), sunYNow = Y(nowT);

  // The sky acts on real windows, not labels.
  const inFajrWindow = valid(fajr) && nowMs >= fajr.getTime() && nowMs < sunrise.getTime();
  const inDayWindow = nowMs >= sunrise.getTime() && nowMs <= maghrib.getTime();
  const inSunsetWindow = valid(isha) && nowMs > maghrib.getTime() && nowMs <= isha.getTime();
  const night = !inDayWindow;
  const sunX = X(sunrise);
  // The setting disc fades out across the maghrib→isha window.
  const sinkFade = (() => {
    if (!inSunsetWindow || !valid(isha)) return 0;
    const u = (nowMs - maghrib.getTime()) / (isha.getTime() - maghrib.getTime());
    return Math.max(0.15, 1 - u);
  })();

  const next = GLAZES[nextName] || GLAZES.dhuhr;
  const dot = (t, key) => {
    if (!valid(t)) return null;
    if (t.getTime() < spanStart.getTime() || t.getTime() > spanEnd.getTime()) return null;
    const p = { x: X(t), y: Y(t) };
    const isNext = key === nextName;
    const isPast = t.getTime() < nowMs;
    const ink = (GLAZES[key] || GLAZES.dhuhr).ink;
    if (isNext) {
      return (
        <React.Fragment key={key}>
          <Circle cx={p.x} cy={p.y} r={5} fill="none" stroke={ink} strokeWidth={1} strokeDasharray="2 3" />
          <Circle cx={p.x} cy={p.y} r={2.8} fill={ink} />
          <Circle cx={p.x} cy={p.y} r={7} fill="none" stroke={C.accentGold} strokeWidth={1.4} />
        </React.Fragment>
      );
    }
    if (isPast) {
      return <Circle key={key} cx={p.x} cy={p.y} r={2.8} fill={ink} fillOpacity={0.85} />;
    }
    return <Circle key={key} cx={p.x} cy={p.y} r={5} fill="none" stroke={ink} strokeWidth={1} strokeDasharray="2 3" />;
  };

  let caption;
  if (raw < 0) {
    caption = S.risingInAfter(toArabicDigits(formatCountdown(sunrise.getTime() - nowMs)));
  } else if (raw > 1) {
    caption = S.nightNowSunriseAt(toArabicDigits(formatTime(sunrise, timezone)));
  } else {
    caption = S.remainingOnSunset(toArabicDigits(formatCountdown(maghrib.getTime() - nowMs)));
  }

  return (
    <View style={styles.plate}>
      <View style={{ width: W, height: H }}>
        {/* -------- static layer -------- */}
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <RadialGradient id="arcSunBody" cx="38%" cy="30%" rx="55%" ry="55%">
              <Stop offset="0" stopColor="#f6e7b4" stopOpacity="1" />
              <Stop offset="0.55" stopColor="#ddba68" stopOpacity="1" />
              <Stop offset="1" stopColor="#a97b38" stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="arcGlowF" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={C.accentGold} stopOpacity="0.32" />
              <Stop offset="1" stopColor={C.accentGold} stopOpacity="0" />
            </RadialGradient>
            <ClipPath id="arcHorizonClip">
              <Rect x={0} y={0} width={W} height={cy} />
            </ClipPath>
            <Mask id="arcMoonMask">
              <Rect x={0} y={0} width={W} height={H} fill="white" />
              <Circle cx={sunXNow + 2.8} cy={sunYNow - 2} r={6.6} fill="black" />
            </Mask>
          </Defs>

          {/* warm glows on the horizon during the two threshold windows */}
          {inFajrWindow ? (
            <Rect x={sunX - 46} y={cy - 16} width={92} height={34} rx={17} fill="url(#arcGlowF)" />
          ) : null}
          {inSunsetWindow ? (
            <><Rect x={X(maghrib) - 46} y={cy - 16} width={92} height={32} rx={16} fill="url(#arcGlowF)" opacity={sinkFade} /></>
          ) : null}

          {/* steady stars only while the sun is below the horizon */}
          {night ? (
            <G>
              {STARS_A.map((st, i) => (
                <Circle key={`sa${i}`} cx={st.x} cy={st.y} r={st.r} fill={C.accentGold} opacity={0.5} />
              ))}
            </G>
          ) : null}

          <Line x1={8} y1={cy} x2={W - 8} y2={cy} stroke={C.hairline} strokeWidth={1} strokeDasharray="1 5" strokeLinecap="round" />
          <Path d={`M148,${cy} v-5 a12,11 0 0 1 24,0 v5 z`} fill={C.hairlineSoft} />
          <Path d={`M141,${cy} v-15 M145,${cy} v-15 M175,${cy} v-15 M179,${cy} v-15 M160,${cy - 16} v-4`} stroke={C.hairline} strokeWidth={1.2} />
          <Path d={d} stroke={C.hairlineSoft} strokeWidth={1.4} fill="none" />
          <Path d={d} stroke={next.ink} strokeWidth={2} fill="none" strokeDasharray={`${fillLen} ${plen}`} strokeLinecap="round" />
          {dot(fajr, 'fajr')}{dot(dhuhr, 'dhuhr')}{dot(asr, 'asr')}{dot(maghrib, 'maghrib')}{dot(isha, 'isha')}

          {/* the rising half-disc at fajr */}
          {inFajrWindow ? (
            <G clipPath="url(#arcHorizonClip)">
              <Circle cx={sunX} cy={cy} r={8} fill="url(#arcSunBody)" />
            </G>
          ) : null}
          {/* the day traveler */}
          {inDayWindow ? (
            <React.Fragment>
              <Circle cx={sunXNow} cy={sunYNow} r={8} fill="url(#arcSunBody)" />
              <Circle cx={sunXNow - 2.2} cy={sunYNow - 2.4} r={2.6} fill="#f7e9bd" opacity={0.85} />
            </React.Fragment>
          ) : null}
          {/* the sinking half-disc at maghrib — same shape, gently dimming */}
          {inSunsetWindow ? (
            <G clipPath="url(#arcHorizonClip)" opacity={sinkFade}>
              <Circle cx={X(maghrib)} cy={cy} r={8} fill="url(#arcSunBody)" />
            </G>
          ) : null}
          {/* the kepshé crescent + star — night's traveler, never blinking */}
          {night ? (
            <G>
              <Circle cx={sunXNow} cy={sunYNow} r={7.2} fill={C.goldBright} mask="url(#arcMoonMask)" />
              <Circle cx={sunXNow + 8.6} cy={sunYNow - 7.2} r={1.7} fill={C.goldBright} />
            </G>
          ) : null}
        </Svg>

        {/* -------- breathing layer (corona + twinkle) -------- */}
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: pulse }} pointerEvents="none">
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {inFajrWindow ? <SunRays cx={sunX} cy={cy} color={C.accentGold} clip /> : null}
            {inDayWindow ? <SunRays cx={sunXNow} cy={sunYNow} color={C.accentGold} /> : null}
            {inSunsetWindow ? <SunRays cx={X(maghrib)} cy={cy} color={C.accentGold} clip /> : null}
            {night ? (
              <G>
                {KHATAMS_B.map((k, i) => (
                  <Rect
                    key={`kb${i}`}
                    x={k.x - k.s / 2}
                    y={k.y - k.s / 2}
                    width={k.s}
                    height={k.s}
                    rx={1}
                    fill={C.accentGold}
                    opacity={0.85}
                    transform={`rotate(45 ${k.x} ${k.y})`}
                  />
                ))}
                {STARS_B.map((st, i) => (
                  <Circle key={`sb${i}`} cx={st.x} cy={st.y} r={st.r} fill={C.goldBright} opacity={0.9} />
                ))}
              </G>
            ) : null}
          </Svg>
        </Animated.View>
      </View>
      <Text style={[styles.caption, { color: C.textSecondary }]}>{caption}</Text>
    </View>
  );
}

export default DayArc;
export const MemoDayArc = React.memo(DayArc, (p, n) => (
  p.fajr === n.fajr && p.sunrise === n.sunrise && p.dhuhr === n.dhuhr &&
  p.asr === n.asr && p.maghrib === n.maghrib && p.isha === n.isha &&
  p.timezone === n.timezone && p.C === n.C && p.nextName === n.nextName &&
  Math.floor(p.now.getTime() / 30000) === Math.floor(n.now.getTime() / 30000)
));

const styles = StyleSheet.create({
  plate: { width: '100%', maxWidth: 340, alignSelf: 'center', alignItems: 'center' },
  caption: { fontFamily: 'Cairo', fontSize: 10.5, marginTop: 8, textAlign: 'center', writingDirection: 'rtl' },
});
