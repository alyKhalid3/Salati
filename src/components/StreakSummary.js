// src/components/StreakSummary.js — the tally slab.
// «المحراب» world: a gold-framed ivory slab carrying three Cairo tallies;
// the last seven days as small keys — filled gold = kept, ring = missed,
// and today wears the gold crown.
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { usePrayer } from '../context/PrayerContext';
import { FONTS, RADII } from '../utils/theme';
import { S, toArabicDigits } from '../utils/strings';

function StreakSummary({ streaks, dailyStreak, bestDailyStreak }) {
  const { C, prayedStatus, locationDateKey } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, delay: 180, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 380, delay: 180, useNativeDriver: true }),
    ]);
    entrance.start();
    return () => entrance.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const totalStreak = prayers.reduce((sum, p) => sum + (streaks[p]?.current || 0), 0);
  const bestStreak = bestDailyStreak ?? 0;
  const [week, setWeek] = React.useState([]);

  // Last 7 days: today's dot comes from live in-memory status (instant),
  // past 6 days load in parallel from storage — never 7 serial round-trips.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const todayKey = locationDateKey || new Date().toDateString();
        const keys = [];
        for (let i = 6; i >= 1; i -= 1) {
          const d = new Date(todayKey);
          d.setDate(d.getDate() - i);
          keys.push(d.toDateString());
        }
        const { storageBackend } = await import('../utils/storage');
        const past = await Promise.all(keys.map((k) => storageBackend.getPrayerStatus(k)));
        if (cancelled) return;
        const pastDots = past.map((s) => prayers.every((p) => s[p] && s[p].completed));
        const todayDone = prayers.every((p) => prayedStatus[p] && prayedStatus[p].completed);
        setWeek([...pastDots, todayDone]);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [streaks, dailyStreak, prayedStatus, locationDateKey]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{toArabicDigits(totalStreak)}</Text>
          <Text style={styles.statLabel}>{S.streakTotal}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statNumber, styles.statNumberToday]}>{toArabicDigits(dailyStreak)}</Text>
          <Text style={styles.statLabel}>{S.streakDaily}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{toArabicDigits(bestStreak)}</Text>
          <Text style={styles.statLabel}>{S.streakBest}</Text>
        </View>
      </View>

      {week.length > 0 && (
        <View style={styles.weekRow}>
          <Text style={styles.weekLabel}>{toArabicDigits(7)} {S.streakUnit} · سجل الأيام</Text>
          <View style={styles.weekDots}>
            {week.map((done, i) => (
              <View
                key={i}
                style={[
                  styles.weekDot,
                  done ? styles.weekDotDone : styles.weekDotEmpty,
                  i === week.length - 1 && styles.weekDotToday,
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    marginTop: 8,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: C.goldFaint,
    padding: 20,
    direction: 'rtl',
    boxShadow: C.raiseSm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    direction: 'rtl',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statNumber: {
    fontFamily: FONTS.arabic,
    fontSize: 32,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  statNumberToday: { color: C.accentGold },
  statLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10.4,
    color: C.textSecondary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: C.hairlineSoft,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.hairlineSoft,
    direction: 'rtl',
  },
  weekLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10.5,
    color: C.textSecondary,
  },
  weekDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    direction: 'rtl',
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  weekDotDone: {
    backgroundColor: C.accentGold,
    borderWidth: 0,
  },
  weekDotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.hairline,
  },
  weekDotToday: {
    borderColor: C.accentGold,
    borderWidth: 1.6,
  },
});

export default React.memo(StreakSummary);
