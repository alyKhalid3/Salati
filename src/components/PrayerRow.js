// src/components/PrayerRow.js - web .prayer-row
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';

const getStyles = (C) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    gap: 14,
    backgroundColor: C.elevated,
    direction: 'rtl',
  },
  activeContainer: {
    backgroundColor: 'rgba(212, 149, 106, 0.13)',
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  lockedContainer: { opacity: 0.6 },
  lockedText: { color: C.textMuted },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderTopColor: `rgba(${C.paper}, 0.14)`,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconLit: {
    borderTopColor: 'rgba(255, 244, 224, 0.55)',
    shadowColor: C.accent,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  prayerDetails: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontFamily: 'Amiri',
    fontSize: 20,
    fontWeight: '600',
    color: C.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  prayedName: {
    color: C.textSecondary,
    textDecorationLine: 'line-through',
    textDecorationColor: C.accent,
  },
  time: {
    fontFamily: 'Cairo',
    fontSize: 13.6,
    color: C.textSecondary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
    textAlign: 'right',
    writingDirection: 'ltr',
  },
  activeTime: { color: C.accent },
  prayedTime: { color: C.accent },
  action: { flexDirection: 'row', alignItems: 'center', direction: 'rtl' },
  prayedAction: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'rtl' },
  markBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: `rgba(${C.paper}, 0.10)`,
    minWidth: 70,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBtnText: { fontFamily: 'Cairo', fontSize: 12, fontWeight: '600', color: C.textSecondary, writingDirection: 'rtl' },
  lockedBtn: { backgroundColor: C.surface, opacity: 0.4 },
  lockedBtnText: { color: C.textMuted },
  markedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: C.accent,
    minWidth: 70,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markedBtnText: { fontFamily: 'Cairo', fontSize: 12, fontWeight: '600', color: C.bg, writingDirection: 'rtl' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  streakBadgeText: { fontFamily: 'Cairo', fontSize: 11, fontWeight: '700', color: C.accent },
  sunrisePlaceholder: { width: 70, height: 32 },
});

const PrayerIcon = ({ name, isActive, isPrayed, isLocked }) => {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const iconColor = isPrayed ? C.bg : isLocked ? C.textMuted : isActive ? C.bg : C.accentSoft;
  const bgColor = isPrayed ? C.accent : isLocked ? C.surface2 : isActive ? C.accent : C.iconBg;
  const ringColor = isPrayed || (isActive && !isLocked) ? C.accentGold : isLocked ? C.border : 'rgba(212, 149, 106, 0.45)';
  const lit = isPrayed || (isActive && !isLocked);
  const icons = {
    fajr: <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={iconColor} strokeWidth={1.5} fill="none" />,
    sunrise: (
      <>
        <Circle cx={12} cy={12} r={4} stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke={iconColor} strokeWidth={1.5} fill="none" />
      </>
    ),
    dhuhr: (
      <>
        <Circle cx={12} cy={12} r={5} stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Line x1={12} y1={1} x2={12} y2={3} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={12} y1={21} x2={12} y2={23} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={4.22} y1={4.22} x2={5.64} y2={5.64} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={18.36} y1={18.36} x2={19.78} y2={19.78} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={1} y1={12} x2={3} y2={12} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={21} y1={12} x2={23} y2={12} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={4.22} y1={19.78} x2={5.64} y2={18.36} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={18.36} y1={5.64} x2={19.78} y2={4.22} stroke={iconColor} strokeWidth={1.5} />
      </>
    ),
    asr: <Path d="M17.5 19c0-1.7-1.3-3-3-3h-11a4 4 0 0 1-.8-7.9 5 5 0 0 1 9.7-1.5 3.5 3.5 0 0 1 4.6 4.5A4 4 0 0 1 17.5 19z" stroke={iconColor} strokeWidth={1.5} fill="none" />,
    maghrib: (
      <>
        <Path d="M12 10V2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="m4.93 10.93 1.41 1.41" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M2 18h2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M20 18h2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="m19.07 10.93-1.41 1.41" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M22 22H2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="m16 6-4 4-4-4" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M16 18a4 4 0 0 0-8 0" stroke={iconColor} strokeWidth={1.5} fill="none" />
      </>
    ),
    isha: <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke={iconColor} strokeWidth={1.5} fill="none" />,
  };
  return (
    <View style={[
      styles.iconContainer,
      { backgroundColor: bgColor, borderColor: ringColor },
      lit && styles.iconLit,
    ]}>
      <Svg width={18} height={18} viewBox="0 0 24 24">{icons[name]}</Svg>
    </View>
  );
};

function PrayerRow({ name, time, isActive, isPrayed, streak, onTogglePrayed, delay = 0, isLocked = false }) {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(-10)).current;
  // Celebration pop on the streak badge when the user marks prayed.
  const badgeScale = useRef(new Animated.Value(1)).current;
  const wasPrayed = useRef(isPrayed);
  useEffect(() => {
    if (isPrayed && !wasPrayed.current) {
      badgeScale.setValue(0.4);
      const pop = Animated.timing(badgeScale, { toValue: 1, duration: 450, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), useNativeDriver: true });
      pop.start();
      wasPrayed.current = true;
      return () => pop.stop();
    }
    wasPrayed.current = isPrayed;
    return undefined;
  }, [isPrayed]);

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, []);

  const handleTogglePrayed = async () => {
    if (isLocked && !isPrayed) return;
    if (typeof onTogglePrayed === 'function') await onTogglePrayed(name, isPrayed);
  };

  const locked = isLocked || name === 'sunrise';
  return (
    <Animated.View
      testID={`prayer-${name}`}
      dataSet={{ prayer: name, locked: locked ? 'true' : 'false' }}
      style={[
        styles.container,
        isActive && !isPrayed && !locked && styles.activeContainer,
        locked && !isPrayed && styles.lockedContainer,
        { opacity: fadeAnim, transform: [{ translateX: translateAnim }] },
      ]}
    >
      <PrayerIcon name={name} isActive={isActive && !locked} isPrayed={isPrayed} isLocked={locked} />
      <View style={styles.prayerDetails}>
        <Text style={[styles.name, isPrayed && styles.prayedName, locked && !isPrayed && styles.lockedText]}>{PRAYER_NAMES[name]}</Text>
        <Text style={[styles.time, isPrayed && styles.prayedTime, isActive && !isPrayed && !locked && styles.activeTime, locked && !isPrayed && styles.lockedText]}>{time}</Text>
      </View>
      <View style={styles.action}>
        {name === 'sunrise' ? (
          <View style={styles.sunrisePlaceholder} />
        ) : isPrayed ? (
          <View style={styles.prayedAction}>
            {streak && streak.current > 0 && (
              <Animated.View style={[styles.streakBadge, { transform: [{ scale: badgeScale }] }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M12 2c.7 5.8 2.2 7.3 8 8-5.8.7-7.3 2.2-8 8-.7-5.8-2.2-7.3-8-8 5.8-.7 7.3-2.2 8-8Z" fill={C.accentGold} stroke={C.accent} strokeWidth={1} />
                </Svg>
                <Text style={styles.streakBadgeText}>{streak.current}</Text>
              </Animated.View>
            )}
            <TouchableOpacity style={styles.markedBtn} onPress={handleTogglePrayed} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`إلغاء تسجيل صلاة ${PRAYER_NAMES[name]}`}>
              <Text style={styles.markedBtnText}>✓ صليت</Text>
            </TouchableOpacity>
          </View>
        ) : locked ? (
          <View testID={`prayer-${name}-button-locked`} style={[styles.markBtn, styles.lockedBtn]} pointerEvents="none" accessible accessibilityRole="button" accessibilityLabel={`تسجيل صلاة ${PRAYER_NAMES[name]}`} accessibilityState={{ disabled: true }}>
            <Text style={[styles.markBtnText, styles.lockedBtnText]}>صليت</Text>
          </View>
        ) : (
          <TouchableOpacity testID={`prayer-${name}-button`} style={styles.markBtn} onPress={handleTogglePrayed} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`تسجيل صلاة ${PRAYER_NAMES[name]}`}>
            <Text style={styles.markBtnText}>صليت</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}


export default React.memo(PrayerRow);
