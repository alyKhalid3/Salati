// src/components/PrayerRow.js — a times slip in the «المحراب» world.
// States (the grammar of the times page):
//   BASED  — prayer time not in yet: subdued cream, pigment dot, no key.
//   WINDOW — this prayer holds the day right now: green-washed face,
//            gold edge, filled green key.
//   DONE   — marked prayed: struck name, gold check, quiet face.
//
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';
import { GLAZES, TYPE, RADII, FONTS } from '../utils/theme';
import { S, toArabicDigits } from '../utils/strings';

const getStyles = (C, isDaytime) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADII.lg,
    gap: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.hairlineSoft,
    direction: 'rtl',
    boxShadow: C.raiseSm,
  },
  windowContainer: {
    backgroundColor: isDaytime ? C.green : C.greenDeep,
    borderColor: C.accentGold,
    borderWidth: 1,
  },
  dotWrap: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, minWidth: 0, gap: 1 },
  name: { fontFamily: FONTS.arabic, fontSize: TYPE.prayer, fontWeight: '700', color: C.text, textAlign: 'right' },
  time: { fontFamily: FONTS.sans, fontSize: 13.6, color: C.textSecondary, fontVariant: ['tabular-nums'], letterSpacing: 0.4, textAlign: 'right' },
  windowName: { color: C.onGreen, fontFamily: FONTS.arabic, fontSize: 22 },
  windowTime: { color: C.goldBright },
  doneName: { color: C.textMuted, textDecorationLine: 'line-through', textDecorationColor: C.danger, textDecorationStyle: 'dotted', fontSize: 17 },
  doneTime: { color: C.textMuted },
  streakChip: {
    borderRadius: 9,
    backgroundColor: C.goldFaint,
    paddingVertical: 1,
    paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  windowStreakChip: { backgroundColor: 'rgba(0, 0, 0, 0.24)' },
  streakText: { fontFamily: FONTS.sans, fontSize: 9, color: isDaytime ? '#8a6c2b' : C.goldBright, fontWeight: '600', writingDirection: 'rtl' },
  action: {
    minWidth: 78,
    minHeight: 42,
    borderRadius: RADII.md,
    backgroundColor: C.green,
    borderWidth: 1,
    borderColor: C.goldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
  },
  actionDone: { backgroundColor: 'transparent', borderColor: C.hairline },
  actionIcon: { color: C.onGreen },
  actionCheck: { color: C.accentGold },
  actionText: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: C.onGreen, writingDirection: 'rtl' },
  actionTextDone: { color: C.textSecondary, fontWeight: '600' },
  ghost: { minWidth: 78, minHeight: 42 },
  stampWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});

export default function PrayerRow({ name, time, isActive, isPrayed: isPrayedProp, streak, onTogglePrayed, delay = 0, isLocked, isNext }) {  const { C, isDaytime } = usePrayer();
  const styles = React.useMemo(() => getStyles(C, isDaytime), [C, isDaytime]);
  const glaze = GLAZES[name] || GLAZES.dhuhr;

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(entrance, { toValue: 1, duration: 450, delay, easing: Easing.out(Easing.ease), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The gold khatam stamp — pressed the instant this slip is marked,
  // rings in, then settles into the struck state and lifts away.
  const [stamps, setStamps] = useState(0);
  const stampScale = useRef(new Animated.Value(2.4)).current;
  const stampOpacity = useRef(new Animated.Value(0)).current;
  const stampRef = useRef(null);
  const prevPrayed = useRef(isPrayedProp);
  useEffect(() => {
    if (isPrayedProp && !prevPrayed.current) {
      stampScale.setValue(2.4);
      stampOpacity.setValue(0);
      setStamps((n) => n + 1);
      const seq = Animated.sequence([
        Animated.parallel([
          Animated.timing(stampOpacity, { toValue: 1, duration: 170, useNativeDriver: true }),
          Animated.timing(stampScale, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.timing(stampOpacity, { toValue: 0, duration: 320, delay: 500, useNativeDriver: true }),
      ]);
      stampRef.current = seq;
      seq.start(() => setStamps(0));
    }
    prevPrayed.current = isPrayedProp;
    return () => { if (stampRef.current) stampRef.current.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrayedProp]);

  let mainStyle = [styles.container];
  if (isPrayedProp) mainStyle = [styles.container];
  else if (isActive) mainStyle = [styles.container, styles.windowContainer];
  else if (isLocked) mainStyle = isNext ? [styles.container] : [styles.container, { opacity: 0.55 }];

  const markable = !isLocked || isPrayedProp;

  return (
    <Animated.View style={[mainStyle, { transform: [{ translateY: Animated.multiply(entrance, 8) }] }]}>
      <View style={styles.dotWrap}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4.6} fill={isPrayedProp ? C.textMuted : glaze.ink} />
          {!isPrayedProp && !isActive ? (
            <Circle cx={12} cy={12} r={7.4} fill="none" stroke={glaze.ink} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="2.4 2.8" />
          ) : null}
        </Svg>
      </View>
      <View style={styles.details}>
        <Text style={[styles.name, isActive ? styles.windowName : null, isPrayedProp ? styles.doneName : null]}>{PRAYER_NAMES[name]}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'rtl' }}>
          <Text style={[styles.time, isActive ? styles.windowTime : null, isPrayedProp ? styles.doneTime : null]}>{time}</Text>
          {!isPrayedProp && !!streak && streak.current > 0 && (
            <View style={[styles.streakChip, isActive ? styles.windowStreakChip : null]}>
              <Text style={styles.streakText}>{S.streakBadge(toArabicDigits(streak.current))}</Text>
            </View>
          )}
        </View>
      </View>
      {markable ? (
        <TouchableOpacity
          style={[styles.action, isPrayedProp ? styles.actionDone : null]}
          onPress={() => onTogglePrayed(name, isPrayedProp)}
          disabled={isLocked}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ checked: !!isPrayedProp, disabled: isLocked }}
          accessibilityLabel={`${isPrayedProp ? 'إلغاء تسجيل' : S.markPrayed} ${PRAYER_NAMES[name]}`}
        >
          {isPrayedProp ? (
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.accentGold} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          ) : null}
          <Text style={[styles.actionText, isPrayedProp ? styles.actionTextDone : null]}>
            {isPrayedProp ? S.marked : S.markPrayed}
          </Text>
        </TouchableOpacity>
      ) : (
        <View pointerEvents="none" style={styles.ghost} />
      )}
      {stamps > 0 ? (
        <Animated.View key={stamps} pointerEvents="none" style={[styles.stampWrap, { opacity: stampOpacity, transform: [{ scale: stampScale }] }]}>
          <Svg width={34} height={34} viewBox="0 0 30 30">
            <Rect x={7.5} y={7.5} width={15} height={15} rx={2.6} stroke={C.goldBright} fill="none" strokeWidth={1.4} transform="rotate(45 15 15)" />
            <Rect x={13} y={13} width={4} height={4} rx={0.8} fill={C.accentGold} transform="rotate(45 15 15)" />
          </Svg>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
