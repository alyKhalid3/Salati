// src/components/StreakSummary.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { PRAYER_NAMES } from '../utils/prayerTimes';

export default function StreakSummary({ streaks, dailyStreak }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, [streaks]);

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  const totalStreak = prayers.reduce((sum, p) => {
    const streak = streaks[p];
    return sum + (streak ? streak.current : 0);
  }, 0);

  const bestStreak = prayers.reduce((max, p) => {
    const streak = streaks[p];
    return Math.max(max, streak ? streak.best : 0);
  }, 0);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4956a" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </View>
        <Text style={styles.title}>سلسلة الصلوات</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{totalStreak}</Text>
          <Text style={styles.statLabel}>إجمالي السلسلة</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{dailyStreak}</Text>
          <Text style={styles.statLabel}>سلسلة الأيام</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{bestStreak}</Text>
          <Text style={styles.statLabel}>أفضل سلسلة</Text>
        </View>
      </View>

      <View style={styles.prayerStreaks}>
        {prayers.map((prayer) => {
          const streak = streaks[prayer];
          const current = streak ? streak.current : 0;
          const best = streak ? streak.best : 0;
          
          return (
            <View key={prayer} style={styles.prayerStreakItem}>
              <Text style={styles.prayerStreakName}>{PRAYER_NAMES[prayer]}</Text>
              <View style={styles.prayerStreakBadges}>
                {current > 0 && (
                  <View style={styles.currentStreak}>
                    <Text style={styles.currentStreakText}>{current}</Text>
                  </View>
                )}
                {best > 0 && (
                  <View style={styles.bestStreak}>
                    <Text style={styles.bestStreakText}>🏆 {best}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#4a4740',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d4956a',
  },
  statLabel: {
    fontSize: 10,
    color: '#8a857a',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#1a1a1a',
  },
  prayerStreaks: {
    gap: 8,
  },
  prayerStreakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  prayerStreakName: {
    fontFamily: 'Amiri',
    fontSize: 14,
    fontWeight: '600',
    color: '#f0ece4',
  },
  prayerStreakBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  currentStreak: {
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentStreakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4956a',
  },
  bestStreak: {
    backgroundColor: 'rgba(212, 149, 106, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestStreakText: {
    fontSize: 10,
    color: '#8a857a',
  },
});
