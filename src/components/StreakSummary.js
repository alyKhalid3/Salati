// src/components/StreakSummary.js - web .streak-summary
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Path } from 'react-native-svg';

export default function StreakSummary({ streaks, dailyStreak, bestDailyStreak }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 350, useNativeDriver: false }),
      Animated.timing(translateAnim, { toValue: 0, duration: 600, delay: 350, useNativeDriver: false }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [streaks, dailyStreak, bestDailyStreak]);

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const totalStreak = prayers.reduce((sum, p) => sum + (streaks[p]?.current || 0), 0);
  const bestStreak = bestDailyStreak ?? 0;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#d4956a" strokeWidth={1.5}>
            <Path d="M12 2L2 7l10 5 10-5-10-5z" />
            <Path d="M2 17l10 5 10-5" />
            <Path d="M2 12l10 5 10-5" />
          </Svg>
        </View>
        <Text style={styles.title}>سلسلة الصلوات</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{totalStreak}</Text>
          <Text style={styles.statLabel}>إجمالي سلاسل الصلوات</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{dailyStreak}</Text>
          <Text style={styles.statLabel}>سلسلة الأيام</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{bestStreak}</Text>
          <Text style={styles.statLabel}>أفضل سلسلة أيام</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    direction: 'rtl',
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Cairo',
    fontSize: 10.4,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#4a4740',
    writingDirection: 'rtl',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    direction: 'rtl',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Cairo',
    fontSize: 24,
    fontWeight: '700',
    color: '#d4956a',
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'Cairo',
    fontSize: 10.4,
    color: '#8a857a',
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#1a1a1a',
  },
});
