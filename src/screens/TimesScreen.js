// src/screens/TimesScreen.js — the times page of the «المحراب» world.
// The full day's six slips with their state machine, the sun-path plate
// above them, and the calculation note beneath. Known locally as مضافة
// المواقيت. States: green-washed = the living window, raised = waiting,
// struck = prayed, dimmed asleep = locked.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrayer } from '../context/PrayerContext';
import { formatTime, getHijriDate, resolveLocationTimeZone } from '../utils/prayerTimes';
import PrayerRow from '../components/PrayerRow';
import { MemoDayArc } from '../components/DayArc';
import { FONTS, METHOD_LABELS } from '../utils/theme';
import { S, toArabicDigits } from '../utils/strings';

export default function TimesScreen() {
  const {
    prayerTimes, nextPrayer, currentPrayer, isPrayed, getPrayerStreak, togglePrayed,
    isDaytime, C, location, locationDateKey, madhab, now,
  } = usePrayer();
  const styles = useMemo(() => getStyles(C), [C]);
  const nowMs = now.getTime();
  const displayTimezone = resolveLocationTimeZone(location || { timezone: 'Africa/Cairo' });
  const hijri = useMemo(() => getHijriDate(new Date(), displayTimezone), [locationDateKey, displayTimezone]);
  const methodLabel = METHOD_LABELS[(location && location.method) || 'Egyptian'] || '';

  if (!prayerTimes || !nextPrayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{S.loadingTimes}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{S.todayPrayers}</Text>
          <Text style={styles.subtitle}>{hijri}</Text>
        </View>

        <MemoDayArc fajr={prayerTimes?.fajr} sunrise={prayerTimes?.sunrise} dhuhr={prayerTimes?.dhuhr} asr={prayerTimes?.asr} maghrib={prayerTimes?.maghrib} isha={prayerTimes?.isha} now={now} timezone={displayTimezone} C={C} nextName={nextPrayer.name} />

        <View style={styles.list}>
          {['fajr','sunrise','dhuhr','asr','maghrib','isha'].map((p, i) => {
            const secs = prayerTimes[p] instanceof Date ? prayerTimes[p].getTime() : 0;
            const isLocked = p === 'sunrise' || (secs > 0 && secs > nowMs);
            return (
              <PrayerRow key={p} name={p} time={toArabicDigits(formatTime(prayerTimes[p], displayTimezone))} isActive={currentPrayer === p} isPrayed={isPrayed(p)} streak={getPrayerStreak(p)} onTogglePrayed={togglePrayed} delay={i * 60} isLocked={isLocked} isNext={nextPrayer && nextPrayer.name === p} />
            );
          })}
        </View>

        {!!methodLabel && (
          <Text style={styles.meta}>{methodLabel} · {madhab === 'Hanafi' ? S.madhab_hanafi : S.madhab_shafi}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.text, fontSize: 16, fontFamily: FONTS.sans },
  scrollView: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 132, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 10 },
  header: { alignItems: 'center', marginBottom: 16, gap: 4, direction: 'rtl' },
  title: { fontFamily: FONTS.arabic, fontSize: 26, fontWeight: '700', color: C.text },
  subtitle: { fontFamily: FONTS.sans, fontSize: 11.5, color: C.textSecondary },
  list: { marginTop: 10, gap: 12, direction: 'rtl' },
  meta: { fontFamily: FONTS.sans, fontSize: 11, lineHeight: 20, color: C.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 12 },
});
