// src/screens/ProgressScreen.js — streaks, and one analytics page.
// The page stays inside this tab. The bottom bar does not change.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrayer } from '../context/PrayerContext';
import StreakSummary from '../components/StreakSummary';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import { storageBackend } from '../utils/storage';
import { FONTS, GLAZES, RADII, RULES } from '../utils/theme';
import { S, toArabicDigits } from '../utils/strings';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const RANGES = [
  { days: 7, label: 'statsRange7' },
  { days: 30, label: 'statsRange30' },
  { days: 90, label: 'statsRange90' },
];

function shiftKey(dateKey, days) {
  const date = new Date(dateKey || new Date().toDateString());
  if (isNaN(date.getTime())) return new Date().toDateString();
  date.setDate(date.getDate() + days);
  return date.toDateString();
}

function RiseIn({ children }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const rise = React.useRef(new Animated.Value(12)).current;
  React.useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [opacity, rise]);
  return <Animated.View style={{ flex: 1, opacity, transform: [{ translateY: rise }] }}>{children}</Animated.View>;
}

function PageHeader({ title, onBack, styles }) {
  return (
    <View style={styles.pageHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel={S.back}>
        <Text style={styles.backText}>{S.back}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

export default function ProgressScreen() {
  const { streaks, dailyStreak, bestDailyStreak, prayedStatus, locationDateKey, C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState(30);
  const [history, setHistory] = React.useState(null);
  const fade = React.useRef(new Animated.Value(0)).current;
  const rise = React.useRef(new Animated.Value(14)).current;

  React.useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, delay: 80, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 380, delay: 80, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [fade, rise]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const todayKey = locationDateKey || new Date().toDateString();
      const keys = Array.from({ length: range }, (_, i) => shiftKey(todayKey, -i));
      const statuses = await Promise.all(keys.map((key) => storageBackend.getPrayerStatus(key)));
      if (cancelled) return;
      setHistory(keys.map((key, i) => {
        const status = statuses[i] || {};
        const prayed = {};
        PRAYERS.forEach((prayer) => {
          prayed[prayer] = !!(status[prayer] && status[prayer].completed);
        });
        const count = PRAYERS.filter((prayer) => prayed[prayer]).length;
        return { key, count, allDone: count === 5, prayed };
      }));
    })();
    return () => { cancelled = true; };
  }, [locationDateKey, prayedStatus, range]);

  if (open) {
    const ready = history && history.length === range;
    const completed = ready ? history.reduce((sum, day) => sum + day.count, 0) : 0;
    const total = range * PRAYERS.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const daysKept = ready ? history.filter((day) => day.allDone).length : 0;
    return (
      <SafeAreaView style={styles.container}>
        <RiseIn>
        <PageHeader title={S.statsTitle} onBack={() => setOpen(false)} styles={styles} />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.filters}>
            {RANGES.map((item) => {
              const active = range === item.days;
              return (
                <TouchableOpacity
                  key={item.days}
                  style={[styles.filter, active && styles.filterActive]}
                  onPress={() => setRange(item.days)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={S[item.label]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{S[item.label]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!ready ? <Text style={styles.loading}>{S.statsLoading}</Text> : (
            <>
              <View style={styles.slab}>
                <View style={styles.slabFrame} pointerEvents="none" />
                <Text style={styles.slabKicker}>{S[RANGES.find((item) => item.days === range).label]}</Text>
                <Text style={styles.heroNumber}>
                  {toArabicDigits(completed)}
                  <Text style={styles.heroOf}> / {toArabicDigits(total)}</Text>
                </Text>
                <Text style={styles.slabCaption}>{S.statsMarked}</Text>
                <View style={styles.bandTrack}>
                  <View style={[styles.bandFill, { width: `${rate}%` }]} />
                </View>
                <View style={styles.slabFoot}>
                  <Text style={styles.slabFootLabel}>{S.statsRate}</Text>
                  <Text style={styles.slabFootValue}>{toArabicDigits(rate)}٪</Text>
                </View>
                <Text style={styles.slabDays}>{toArabicDigits(daysKept)} {S.statsDaysKept}</Text>
              </View>

              <Text style={styles.sectionLabel}>{S.statsPrayers}</Text>
              <View style={styles.prayerList}>
                {PRAYERS.map((prayer) => {
                  const glaze = GLAZES[prayer];
                  const marked = history.filter((day) => day.prayed[prayer]).length;
                  const fill = history.length ? Math.round((marked / history.length) * 100) : 0;
                  return (
                    <View key={prayer} style={styles.slip}>
                      <View style={styles.slipTop}>
                        <View style={[styles.pigment, { backgroundColor: glaze.ink }]} />
                        <Text style={styles.slipName}>{PRAYER_NAMES[prayer]}</Text>
                        <View style={styles.slipStat}>
                          <Text style={styles.slipNum}>{toArabicDigits(marked)}</Text>
                          <Text style={styles.slipStatLabel}>{S.statsPerformed}</Text>
                        </View>
                        <View style={styles.slipStat}>
                          <Text style={styles.slipNumMuted}>{toArabicDigits(history.length)}</Text>
                          <Text style={styles.slipStatLabel}>{S.streakUnit}</Text>
                        </View>
                      </View>
                      <View style={styles.slipTrack}>
                        <View style={[styles.slipFill, { width: `${fill}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>{S.statsCalendar}</Text>
                <Text style={styles.calendarHint}>{S.statsCalendarHint}</Text>
                <View style={styles.grid}>
                  {history.map((day, index) => (
                    <View
                      key={day.key}
                      accessibilityLabel={`${index === 0 ? S.statsToday : ''} ${day.allDone ? S.statsKept : S.statsMissed}`}
                      style={[
                        styles.cell,
                        day.allDone ? styles.cellKept : styles.cellMissed,
                        index === 0 && styles.cellToday,
                      ]}
                    >
                      <Text style={[styles.cellNum, day.allDone && styles.cellNumKept]}>
                        {toArabicDigits(new Date(day.key).getDate())}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
        </RiseIn>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{S.streakTitle}</Text>
        </View>

        <StreakSummary streaks={streaks} dailyStreak={dailyStreak} bestDailyStreak={bestDailyStreak} />

        <Animated.View style={[styles.block, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <Text style={styles.blockTitle}>{S.progressPrayers}</Text>
          {PRAYERS.map((prayer) => {
            const streak = (streaks && streaks[prayer]) || { current: 0, best: 0 };
            return (
              <View key={prayer} style={styles.row}>
                <Text style={styles.rowName}>{PRAYER_NAMES[prayer]}</Text>
                <Text style={[styles.rowCount, streak.current > 0 ? null : styles.rowCountZero]}>
                  {toArabicDigits(streak.current)} {S.streakUnit}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={S.statsMore}
        >
          <Text style={styles.moreTitle}>{S.statsMore}</Text>
          <Text style={styles.moreHint}>{S.statsMoreHint}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollView: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 132, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 10 },
  header: { alignItems: 'center', marginBottom: 14, gap: 2 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    direction: 'rtl',
  },
  backBtn: { minWidth: 64, minHeight: 40, justifyContent: 'center' },
  backText: { fontFamily: FONTS.sans, fontSize: 14, fontWeight: '700', color: C.accentGold, writingDirection: 'rtl' },
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
  moreBtn: {
    marginTop: 16,
    backgroundColor: C.green,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: C.goldFaint,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 3,
    boxShadow: C.raiseSm,
  },
  moreTitle: { fontFamily: FONTS.arabic, fontSize: 22, fontWeight: '700', color: C.goldBright },
  moreHint: { fontFamily: FONTS.sans, fontSize: 12, color: C.onGreenMuted, writingDirection: 'rtl' },
  slab: {
    marginTop: 8,
    backgroundColor: C.green,
    borderTopLeftRadius: 96,
    borderTopRightRadius: 96,
    borderBottomLeftRadius: RADII.lg,
    borderBottomRightRadius: RADII.lg,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: C.raise,
  },
  slabFrame: {
    position: 'absolute',
    top: RULES.archFrameInset,
    bottom: RULES.archFrameInset,
    left: RULES.archFrameInset,
    right: RULES.archFrameInset,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    borderBottomLeftRadius: RADII.md,
    borderBottomRightRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(224, 189, 114, 0.5)',
  },
  slabKicker: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: C.goldBright, marginBottom: 6 },
  heroNumber: { fontFamily: FONTS.sans, fontSize: 40, fontWeight: '700', color: C.goldBright, textAlign: 'center', lineHeight: 48 },
  heroOf: { fontSize: 22, color: C.onGreenMuted, fontWeight: '600' },
  slabCaption: { fontFamily: FONTS.sans, fontSize: 13, color: C.onGreenMuted, textAlign: 'center' },
  bandTrack: {
    alignSelf: 'stretch',
    height: RULES.band,
    borderRadius: RULES.band,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    marginTop: 16,
    overflow: 'hidden',
  },
  bandFill: { height: RULES.band, borderRadius: RULES.band, backgroundColor: C.goldBright },
  slabFoot: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    direction: 'rtl',
  },
  slabFootLabel: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '700', color: C.onGreen },
  slabFootValue: { fontFamily: FONTS.sans, fontSize: 22, fontWeight: '700', color: C.goldBright, lineHeight: 28 },
  slabDays: { fontFamily: FONTS.sans, fontSize: 12, color: C.onGreenMuted, marginTop: 6 },
  filters: { flexDirection: 'row', gap: 8, direction: 'rtl', marginTop: 4, marginBottom: 4 },
  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: RADII.sm,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: C.raiseSm,
  },
  filterActive: { backgroundColor: C.green, borderColor: C.accentGold },
  filterText: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '600', color: C.textSecondary },
  filterTextActive: { color: C.onGreen, fontWeight: '700' },
  sectionLabel: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: C.textMuted, marginTop: 18, marginBottom: 8 },
  prayerList: { gap: 8 },
  slip: {
    backgroundColor: C.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: C.goldFaint,
    overflow: 'hidden',
    boxShadow: C.raiseSm,
  },
  slipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    direction: 'rtl',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  pigment: { width: 9, height: 9, borderRadius: 5 },
  slipName: { flex: 1, fontFamily: FONTS.arabic, fontSize: 20, fontWeight: '700', color: C.text },
  slipStat: { alignItems: 'center', minWidth: 46 },
  slipNum: { fontFamily: FONTS.sans, fontSize: 18, fontWeight: '700', lineHeight: 22, color: C.accentGold },
  slipNumMuted: { fontFamily: FONTS.sans, fontSize: 18, fontWeight: '700', lineHeight: 22, color: C.textSecondary },
  slipStatLabel: { fontFamily: FONTS.sans, fontSize: 10, color: C.textMuted, marginTop: 1 },
  slipTrack: {
    height: RULES.band,
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: RULES.band,
    backgroundColor: C.hairline,
    overflow: 'hidden',
  },
  slipFill: { height: RULES.band, borderRadius: RULES.band, backgroundColor: C.goldBright },
  calendarHint: { fontFamily: FONTS.sans, fontSize: 12, color: C.textSecondary, writingDirection: 'rtl', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, direction: 'rtl' },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellKept: { backgroundColor: C.accentGold },
  cellMissed: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.hairline },
  cellToday: { borderWidth: 1.6, borderColor: C.green },
  cellNum: { fontFamily: FONTS.sans, fontSize: 11, fontWeight: '700', color: C.textSecondary },
  cellNumKept: { color: C.greenDeep },
  loading: { fontFamily: FONTS.sans, fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: 24 },
});
