// src/components/StreakSummary.js - web .streak-summary
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';

function StreakSummary({ streaks, dailyStreak, bestDailyStreak }) {
  const { C, prayedStatus, locationDateKey } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 350, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 600, delay: 350, useNativeDriver: true }),
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
      <View style={styles.header}>
        <View style={styles.icon}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={1.5}>
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

      {week.length > 0 && (
        <View style={styles.weekRow}>
          <Text style={styles.weekLabel}>آخر ٧ أيام</Text>
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
    backgroundColor: C.surface2,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    direction: 'rtl',
    borderWidth: 1,
    borderColor: 'rgba(212, 149, 106, 0.22)',
    borderTopColor: 'rgba(240, 208, 160, 0.40)',
    shadowColor: C.accent,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
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
    color: C.textMuted,
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
    fontSize: 27,
    fontWeight: '700',
    color: C.accent,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 149, 106, 0.30)',
    textShadowRadius: 12,
  },
  statLabel: {
    fontFamily: 'Cairo',
    fontSize: 10.4,
    color: C.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: C.surface,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: `rgba(${C.paper}, 0.06)`,
    direction: 'rtl',
  },
  weekLabel: {
    fontFamily: 'Cairo',
    fontSize: 10.5,
    color: C.textSecondary,
    writingDirection: 'rtl',
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
    borderWidth: 1,
  },
  weekDotDone: {
    backgroundColor: C.accent,
    borderColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  weekDotEmpty: {
    backgroundColor: 'transparent',
    borderColor: C.border,
  },
  weekDotToday: {
    borderColor: C.text,
  },
});

export default React.memo(StreakSummary);
