// src/screens/ProgressScreen.js — the progress page of the «المحراب» world.
// The gold-framed tally slab on top, then one small key per prayer with
// its own chain — the record of الصلوات over days. No chart sugar: what
// counts is the number of days kept.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrayer } from '../context/PrayerContext';
import StreakSummary from '../components/StreakSummary';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import { FONTS, RADII } from '../utils/theme';
import { S, toArabicDigits } from '../utils/strings';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function ProgressScreen() {
  const { streaks, dailyStreak, bestDailyStreak, C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const fade = React.useRef(new Animated.Value(0)).current;
  const rise = React.useRef(new Animated.Value(14)).current;

  React.useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, delay: 80, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 380, delay: 80, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{S.streakTitle}</Text>
        </View>

        <StreakSummary streaks={streaks} dailyStreak={dailyStreak} bestDailyStreak={bestDailyStreak} />

        <Animated.View style={[styles.block, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <Text style={styles.blockTitle}>{S.progressPrayers}</Text>
          {PRAYERS.map((p) => {
            const st = (streaks && streaks[p]) || { current: 0, best: 0 };
            return (
              <View key={p} style={styles.row}>
                <Text style={styles.rowName}>{PRAYER_NAMES[p]}</Text>
                <Text style={[styles.rowCount, st.current > 0 ? null : styles.rowCountZero]}>
                  {toArabicDigits(st.current)} {S.streakUnit}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollView: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 132, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 10 },
  header: { alignItems: 'center', marginBottom: 14, gap: 2 },
  title: { fontFamily: FONTS.arabic, fontSize: 26, fontWeight: '700', color: C.text },
  block: {
    backgroundColor: C.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: C.goldFaint,
    padding: 18,
    marginTop: 14,
    direction: 'rtl',
    boxShadow: C.raiseSm,
  },
  blockTitle: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: C.textMuted, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, direction: 'rtl', borderBottomWidth: 1, borderBottomColor: C.hairlineSoft,
  },
  rowName: { fontFamily: FONTS.arabic, fontSize: 19, fontWeight: '700', color: C.text },
  rowCount: { fontFamily: FONTS.sans, fontSize: 17, fontWeight: '700', color: C.accentGold },
  rowCountZero: { color: C.textMuted, fontWeight: '600' },
});
