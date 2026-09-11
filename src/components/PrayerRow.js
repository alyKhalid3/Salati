// src/components/PrayerRow.js - web .prayer-row
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const PrayerIcon = ({ name, isActive, isPrayed, isLocked }) => {
  const iconColor = isPrayed ? '#0a0a0a' : isLocked ? '#4a4740' : isActive ? '#0a0a0a' : '#8a857a';
  const bgColor = isPrayed ? '#d4956a' : isLocked ? '#1a1a1a' : isActive ? '#d4956a' : '#1a1a1a';
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
    <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
      <Svg width={18} height={18} viewBox="0 0 24 24">{icons[name]}</Svg>
    </View>
  );
};

export default function PrayerRow({ name, time, isActive, isPrayed, streak, onTogglePrayed, delay = 0, isLocked = false }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: false }),
      Animated.timing(translateAnim, { toValue: 0, duration: 500, delay, useNativeDriver: false }),
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
      <Text style={[styles.name, isPrayed && styles.prayedName, locked && !isPrayed && styles.lockedText]}>{PRAYER_NAMES[name]}</Text>
      <Text style={[styles.time, isPrayed && styles.prayedTime, isActive && !isPrayed && !locked && styles.activeTime, locked && !isPrayed && styles.lockedText]}>{time}</Text>
      <View style={styles.action}>
        {name === 'sunrise' ? (
          <View style={styles.sunrisePlaceholder} />
        ) : isPrayed ? (
          <View style={styles.prayedAction}>
            {streak && streak.current > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText}>🔥 {streak.current}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.markedBtn} onPress={handleTogglePrayed} activeOpacity={0.7}>
              <Text style={styles.markedBtnText}>✓ صليت</Text>
            </TouchableOpacity>
          </View>
        ) : locked ? (
          <View testID={`prayer-${name}-button-locked`} style={[styles.markBtn, styles.lockedBtn]} pointerEvents="none">
            <Text style={[styles.markBtnText, styles.lockedBtnText]}>صليت</Text>
          </View>
        ) : (
          <TouchableOpacity testID={`prayer-${name}-button`} style={styles.markBtn} onPress={handleTogglePrayed} activeOpacity={0.7}>
            <Text style={styles.markBtnText}>صليت</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 16,
    backgroundColor: '#0a0a0a',
    direction: 'rtl',
  },
  activeContainer: {
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    borderBottomColor: 'transparent',
    borderRadius: 8,
  },
  lockedContainer: { opacity: 0.6 },
  lockedText: { color: '#4a4740' },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: 'Amiri',
    fontSize: 16,
    fontWeight: '600',
    color: '#f0ece4',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  prayedName: {
    color: '#8a857a',
    textDecorationLine: 'line-through',
    textDecorationColor: '#d4956a',
  },
  time: {
    fontFamily: 'Cairo',
    fontSize: 13.6,
    color: '#8a857a',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    writingDirection: 'ltr',
  },
  activeTime: { color: '#d4956a' },
  prayedTime: { color: '#d4956a' },
  action: { flexDirection: 'row', alignItems: 'center', direction: 'rtl' },
  prayedAction: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'rtl' },
  markBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
    minWidth: 70,
    alignItems: 'center',
  },
  markBtnText: { fontFamily: 'Cairo', fontSize: 12, fontWeight: '600', color: '#8a857a', writingDirection: 'rtl' },
  lockedBtn: { backgroundColor: '#1a1a1a', opacity: 0.4 },
  lockedBtnText: { color: '#4a4740' },
  markedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#d4956a',
    minWidth: 70,
    alignItems: 'center',
  },
  markedBtnText: { fontFamily: 'Cairo', fontSize: 12, fontWeight: '600', color: '#0a0a0a', writingDirection: 'rtl' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  streakBadgeText: { fontFamily: 'Cairo', fontSize: 11, fontWeight: '700', color: '#d4956a' },
  sunrisePlaceholder: { width: 70, height: 32 },
});
