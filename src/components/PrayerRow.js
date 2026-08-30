// src/components/PrayerRow.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import { cancelPrayerNotifications } from '../utils/notifications';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const PrayerIcon = ({ name, isActive, isPrayed }) => {
  const iconColor = isPrayed ? '#0a0a0a' : isActive ? '#d4956a' : '#8a857a';
  const bgColor = isPrayed ? '#d4956a' : isActive ? 'rgba(212, 149, 106, 0.15)' : '#1a1a1a';
  
  const icons = {
    fajr: (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={iconColor} strokeWidth={1.5} fill="none"/>
      </Svg>
    ),
    sunrise: (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={4} stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke={iconColor} strokeWidth={1.5} fill="none"/>
      </Svg>
    ),
    dhuhr: (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={5} stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Line x1={12} y1={1} x2={12} y2={3} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={12} y1={21} x2={12} y2={23} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={4.22} y1={4.22} x2={5.64} y2={5.64} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={18.36} y1={18.36} x2={19.78} y2={19.78} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={1} y1={12} x2={3} y2={12} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={21} y1={12} x2={23} y2={12} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={4.22} y1={19.78} x2={5.64} y2={18.36} stroke={iconColor} strokeWidth={1.5} />
        <Line x1={18.36} y1={5.64} x2={19.78} y2={4.22} stroke={iconColor} strokeWidth={1.5} />
      </Svg>
    ),
    asr: (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M17.5 19c0-1.7-1.3-3-3-3h-11a4 4 0 0 1-.8-7.9 5 5 0 0 1 9.7-1.5 3.5 3.5 0 0 1 4.6 4.5A4 4 0 0 1 17.5 19z" stroke={iconColor} strokeWidth={1.5} fill="none"/>
      </Svg>
    ),
    maghrib: (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M12 10V2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="m4.93 10.93 1.41 1.41" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M2 18h2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M20 18h2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="m19.07 10.93-1.41 1.41" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M22 22H2" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="m16 6-4 4-4-4" stroke={iconColor} strokeWidth={1.5} fill="none" />
        <Path d="M16 18a4 4 0 0 0-8 0" stroke={iconColor} strokeWidth={1.5} fill="none" />
      </Svg>
    ),
    isha: (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke={iconColor} strokeWidth={1.5} fill="none" />
      </Svg>
    ),
  };
  
  return (
    <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
      {icons[name]}
    </View>
  );
};

export default function PrayerRow({ 
  name, 
  time, 
  isActive, 
  isPrayed, 
  streak, 
  onTogglePrayed, 
  delay = 0 
}) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [showStreak, setShowStreak] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTogglePrayed = async () => {
    setShowStreak(true);
    if (typeof onTogglePrayed === 'function') {
      await onTogglePrayed(name, isPrayed);
    }
    // Cancel notifications for this prayer
    await cancelPrayerNotifications(name);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isActive && styles.activeContainer,
        isPrayed && styles.prayedContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <PrayerIcon name={name} isActive={isActive} isPrayed={isPrayed} />
      
      <View style={styles.info}>
        <Text style={[styles.name, isPrayed && styles.prayedText]}>
          {PRAYER_NAMES[name]}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>

      {isPrayed ? (
        <TouchableOpacity
          style={styles.rightSection}
          onPress={handleTogglePrayed}
          activeOpacity={0.7}
        >
          {streak && streak.current > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{streak.current}</Text>
              <Text style={styles.streakLabel}>🔥</Text>
            </View>
          )}
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.markButton, isActive && styles.markButtonActive]}
          onPress={handleTogglePrayed}
          activeOpacity={0.7}
        >
          <Text style={[styles.markButtonText, isActive && styles.markButtonTextActive]}>
            صليت
          </Text>
        </TouchableOpacity>
      )}
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
  },
  activeContainer: {
    backgroundColor: 'rgba(212, 149, 106, 0.1)',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    borderBottomColor: 'transparent',
    borderRadius: 8,
  },
  prayedContainer: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: 'Amiri',
    fontSize: 16,
    fontWeight: '600',
    color: '#f0ece4',
  },
  prayedText: {
    color: '#8a857a',
  },
  time: {
    fontSize: 13,
    color: '#8a857a',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  markButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  markButtonActive: {
    backgroundColor: '#d4956a',
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a857a',
  },
  markButtonTextActive: {
    color: '#0a0a0a',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4956a',
  },
  streakLabel: {
    fontSize: 10,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d4956a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '700',
  },
});
