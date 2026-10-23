// src/screens/HomeScreen.js — the home page of the «المحراب» world.
// A single deep-green mihrab arch on ivory: the next prayer and its
// countdown, the duration band in gold, hijri and phase chips — then the
// verse. Nothing else lives here; times, streaks and settings are pages.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle, Line, Rect, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { usePrayer } from '../context/PrayerContext';
import { useNotification } from '../context/NotificationContext';
import { formatTime, getHijriDate, PRAYER_NAMES, resolveLocationTimeZone } from '../utils/prayerTimes';
import { getRandomMessage } from '../utils/messages';
import { schedulePrayerNotifications, cancelAllNotifications } from '../utils/notifications';
import { storageBackend } from '../utils/storage';
import WisdomCard from '../components/WisdomCard';
import LocationPicker from '../components/LocationPicker';
import CountdownText from '../components/CountdownText';
import MoonCrescent from '../components/MoonCrescent';
import { hijriMoonFraction } from '../utils/moonPhase';
import { GLAZES, RULES, TYPE, RADII, FONTS } from '../utils/theme';
import { S } from '../utils/strings';

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = (str) => String(str).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

// The arch's own night sky — handpicked % anchors, never scrambled.
const ARCH_STARS = [
  { left: '35%', top: 52, r: 2 }, { left: '65%', top: 56, r: 2 },
  { left: '28%', top: 96, r: 2.4, khatam: true }, { left: '72%', top: 92, r: 2.4, khatam: true },
  { left: '23%', top: 138, r: 2 }, { left: '77%', top: 132, r: 2 },
  { left: '18%', top: 178, r: 2.6 }, { left: '82%', top: 172, r: 2.4, khatam: true },
  { left: '41%', top: 36, r: 1.7 }, { left: '59%', top: 34, r: 1.7 },
];

function ArchStars({ C, pulse }) {
  return (
    <React.Fragment>
      {ARCH_STARS.map((st, i) => (
        <Animated.View key={i} pointerEvents="none" style={{ position: 'absolute', left: st.left, top: st.top, opacity: Animated.multiply(pulse, st.khatam ? 0.8 : 0.66) }}>
          <Svg width={st.khatam ? 9 : st.r * 2} height={st.khatam ? 9 : st.r * 2} viewBox={st.khatam ? '0 0 9 9' : `0 0 ${st.r * 2} ${st.r * 2}`}>
            {st.khatam ? (
              <Rect x={1} y={1} width={7} height={7} rx={1} fill={C.goldBright} opacity={0.8} transform="rotate(45 4.5 4.5)" />
            ) : (
              <Circle cx={st.r} cy={st.r} r={st.r} fill={C.goldBright} opacity={0.75} />
            )}
          </Svg>
        </Animated.View>
      ))}
    </React.Fragment>
  );
}

function stripCountry(name) {
  if (!name) return 'القاهرة';
  return name
    .replace('، مصر','').replace('، السعودية','').replace('، الإمارات','')
    .replace('، قطر','').replace('، الكويت','').replace('، البحرين','')
    .replace('، عُمان','').replace('، تركيا','').replace('، المغرب','')
    .replace('، الجزائر','').replace('، تونس','').replace('، الأردن','')
    .replace('، لبنان','').replace('، السودان','').replace('، بريطانيا','').replace('، فرنسا','');
}

// Sun-phase glyph — drawn, never an emoji.
function PhaseGlyph({ phaseKey, color }) {
  const moon = phaseKey === 'night' || phaseKey === 'dusk';
  const c = color;
  if (moon) {
    return (
      <Svg width={13} height={13} viewBox="0 0 24 24">
        <Path d="M20 12.5A8.5 8.5 0 1 1 11.5 4a7 7 0 1 0 8.5 8.5z" fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4.2} fill="none" stroke={c} strokeWidth={1.6} />
      <Line x1={12} y1={2.5} x2={12} y2={5} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={21.5} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={2.5} y1={12} x2={5} y2={12} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={19} y1={12} x2={21.5} y2={12} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={5.3} y1={5.3} x2={7} y2={7} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={17} y1={17} x2={18.7} y2={18.7} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={17} y1={7} x2={18.7} y2={5.3} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={5.3} y1={18.7} x2={7} y2={17} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export default function HomeScreen() {
  const {
    prayerTimes, tomorrowTimes, nextPrayer, isDaytime, C,
    phase, locationDateKey,
    location: contextLocation, setLocation, prayedStatus,
  } = usePrayer();
  const styles = React.useMemo(() => getStyles(C, isDaytime), [C, isDaytime]);
  const { notificationsEnabled, setNotificationsEnabled, reminderMinutes, setReminderMinutes, recurringReminders, ready: notificationsReady } = useNotification();

  const [message, setMessage] = useState(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  // Duration band: exact remaining fraction of the current window.
  const [bandFraction, setBandFraction] = useState(0);

  // Entrance
  const topbarOpacity = useRef(new Animated.Value(0)).current;
  const topbarY = useRef(new Animated.Value(-16)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(22)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  const currentLocation = contextLocation || { latitude: 30.0444, longitude: 31.2357, name: 'القاهرة، مصر', method: 'Egyptian', timezone: 'Africa/Cairo', useDeviceTimezone: false };
  const displayTimezone = resolveLocationTimeZone(currentLocation);
  const hijri = React.useMemo(() => getHijriDate(new Date(), displayTimezone), [locationDateKey, displayTimezone]);
  const cityLabel = stripCountry(currentLocation.name);
  // The Hijri moon fraction + the golden Friday mark.
  const moonF = React.useMemo(() => hijriMoonFraction(new Date()), [locationDateKey]);
  const isFriday = React.useMemo(() => new Date().getDay() === 5, [locationDateKey]);

  // Duration band math — window from the current prayer (or yesterday's
  // isha across midnight) to the next prayer; fraction = time remaining.
  useEffect(() => {
    if (!prayerTimes || !nextPrayer) return undefined;
    const order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const idx = order.indexOf(nextPrayer.name);
    if (idx < 0) return undefined;
    const prevName = idx === 0 ? 'isha' : order[idx - 1];
    let prevTime = prayerTimes[prevName] instanceof Date ? prayerTimes[prevName].getTime() : null;
    const nextTime = nextPrayer.time instanceof Date ? nextPrayer.time.getTime() : null;
    if (!prevTime || !nextTime) return undefined;
    if (nextTime <= prevTime) prevTime -= 24 * 60 * 60 * 1000;
    if (nextTime <= prevTime) return undefined;
    const tick = () => {
      const now = Date.now();
      const f = Math.min(1, Math.max(0, (nextTime - now) / (nextTime - prevTime)));
      setBandFraction(f);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerTimes && nextPrayer && nextPrayer.name, displayTimezone, locationDateKey]);

  useEffect(() => {
    (async () => {
      const s = await storageBackend.getSettings();
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          setBannerVisible(status !== 'granted' || s.notificationsEnabled === false);
        } catch {
          setBannerVisible(s.notificationsEnabled === false);
        }
        return;
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default' && s.notificationsEnabled) setBannerVisible(true);
        else if (!s.notificationsEnabled) setBannerVisible(true);
        else setBannerVisible(false);
      } else if (!s.notificationsEnabled) {
        setBannerVisible(true);
      }
    })();
  }, []);

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(topbarOpacity, { toValue: 1, duration: 380, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(topbarY, { toValue: 0, duration: 380, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 460, delay: 60, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(heroY, { toValue: 0, duration: 460, delay: 60, easing: EASE_OUT, useNativeDriver: true }),
    ]);
    entrance.start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.92, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    setMessage(getRandomMessage('quran'));
    return () => { entrance.stop(); pulse.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!prayerTimes || !notificationsReady) return undefined;
    // Deliberately NOT InteractionManager.runAfterInteractions: the hero's
    // pulse is an Animated.loop that never ends, which starves that queue and
    // silently skipped every schedule pass (nothing was ever armed).
    const id = setTimeout(() => { scheduleAll(); }, 0);
    return () => clearTimeout(id);
  }, [prayerTimes, tomorrowTimes, reminderMinutes, notificationsEnabled, recurringReminders, notificationsReady, prayedStatus]);

  const scheduleAll = async () => {
    if (!prayerTimes) return;
    if (!notificationsEnabled) { await cancelAllNotifications(); return; }
    if (Platform.OS !== 'web') {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;
      } catch {
        return;
      }
    }
    const days = [prayerTimes, tomorrowTimes];
    for (const times of days) {
      if (!times) continue;
      const isToday = times === prayerTimes;
      for (const p of ['fajr','dhuhr','asr','maghrib','isha']) {
        // A prayer already marked prayed keeps its reminders off; the periodic
        // passes re-run settings/location changes and must not resurrect them.
        // Entries are {completed, timestamp} objects — truthy even when not prayed.
        if (isToday && prayedStatus && prayedStatus[p] && prayedStatus[p].completed) continue;
        if (times[p]) await schedulePrayerNotifications(p, times[p], reminderMinutes, { recurring: recurringReminders, day: times.dateKey });
      }
    }
  };

  const handleClosePicker = useCallback(() => setLocationPickerVisible(false), []);
  const handleSelectLocation = useCallback(async (loc) => {
    if (setLocation) await setLocation(loc);
  }, [setLocation]);
  const handleToggle = async (v) => {
    if (v && Platform.OS !== 'web') {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          setNotificationsEnabled(false);
          setBannerVisible(true);
          return;
        }
      } catch {}
    } else if (v && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setNotificationsEnabled(false);
          setBannerVisible(true);
          return;
        }
      } catch {}
    }
    setNotificationsEnabled(v);
    setBannerVisible(!v);
  };

  if (!prayerTimes || !nextPrayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{S.loadingTimes}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextGlaze = GLAZES[nextPrayer.name] || GLAZES.dhuhr;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.topbar, { opacity: topbarOpacity, transform: [{ translateY: topbarY }] }]}>
          <View style={styles.wordmarkRow}>
            {/* the paper mark — dome on its band, crescent docked on the shoulder */}
            <Svg width={18} height={13.7} viewBox="5.2 7.2 13.8 10.5">
              <Rect x={5.6} y={16} width={12.8} height={1.3} rx={0.65} fill={C.accentGold} />
              <Path d="M5.6 16.8 A 5.8 5.5 0 0 1 17.2 16.8 Z" fill={C.green} />
              <Path d="M15.215 9.167 A 1.8 1.8 0 1 1 17.582 11.103 A 1.6 1.6 0 0 0 15.215 9.167 Z" fill={C.accentGold} />
            </Svg>
            <Text style={styles.wordmark}>{S.appName}</Text>
          </View>
          <TouchableOpacity style={styles.cityChip} onPress={() => setLocationPickerVisible(true)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={S.changeLocation(currentLocation.name)}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.accentGold} strokeWidth={2}>
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx={12} cy={10} r={3} />
            </Svg>
            <Text style={styles.cityText} numberOfLines={1}>{cityLabel}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.heroWrap, { opacity: heroOpacity, transform: [{ translateY: heroY }] }]}>
          {/* The mihrab arch — deep-green slab crowned with the dome */}
          <View style={styles.archSlab}>
            <View style={styles.archFrame} pointerEvents="none" />
            {/* the arch's own sky: stars by night, a gilded sliver at the two thresholds */}
            {!isDaytime ? (
              <View pointerEvents="none" style={styles.archSkyField}>
                <ArchStars C={C} pulse={pulseOpacity} />
              </View>
            ) : null}
            {phase.key === 'dawn' || phase.key === 'sunset' ? (
              <View pointerEvents="none" style={styles.glowSliver}>
                <Svg width={240} height={110} viewBox="0 0 240 110">
                  <Defs>
                    <RadialGradient id="archGlow" cx="50%" cy="100%" rx="50%" ry="100%">
                      <Stop offset="0" stopColor={C.goldBright} stopOpacity="0.3" />
                      <Stop offset="1" stopColor={C.goldBright} stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Ellipse cx={120} cy={112} rx={118} ry={98} fill="url(#archGlow)" />
                </Svg>
              </View>
            ) : null}
            {/* crown: the Hijri phase-accurate crescent + its khatam star */}
            <View style={styles.crown}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MoonCrescent r={11} f={moonF} lit={C.accentGold} dark={C.greenDeep} ring={C.goldBright} />
                <Svg width={9} height={9} viewBox="0 0 9 9">
                  <Rect x={1} y={1} width={7} height={7} rx={1} fill={C.accentGold} transform="rotate(45 4.5 4.5)" />
                </Svg>
              </View>
            </View>

            <View style={styles.chipRow}>
              {isFriday ? (
                <View style={[styles.onGreenChip, styles.fridayChip]}>
                  <Svg width={8} height={8} viewBox="0 0 9 9">
                    <Rect x={1} y={1} width={7} height={7} rx={1} fill={C.goldBright} transform="rotate(45 4.5 4.5)" />
                  </Svg>
                  <Text style={styles.fridayText}>{S.fridayKhatam}</Text>
                </View>
              ) : null}
              <View style={styles.onGreenChip}>
                <Text style={styles.chipText}>{hijri || ''}</Text>
              </View>
              <View style={styles.onGreenChip}>
                <PhaseGlyph phaseKey={phase.key} color={C.onGreenMuted} />
                <Text style={styles.chipText}>{phase.label}</Text>
              </View>
            </View>

            <Text style={styles.heroLabel}>{S.nextPrayer}</Text>
            <Text style={styles.heroPrayer}>{PRAYER_NAMES[nextPrayer.name]}</Text>

            <View style={styles.countPanel}>
              <CountdownText time={nextPrayer.time} style={styles.countdown} pulseOpacity={pulseOpacity} />
              <View style={styles.bandTrack} pointerEvents="none">
                <View style={[styles.bandFill, { width: `${Math.round(bandFraction * 100)}%`, backgroundColor: C.goldBright }]} />
              </View>
              <Text style={styles.heroTime}>{toArabicDigits(formatTime(nextPrayer.time, displayTimezone))}</Text>
            </View>
          </View>
        </Animated.View>

        {message ? <WisdomCard message={message} /> : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{S.footerLine}</Text>
        </View>
      </ScrollView>

      {bannerVisible ? (
      <Animated.View style={styles.banner} pointerEvents="box-none">
        <View style={styles.bannerCard}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.accentGold} strokeWidth={1.8}>
            <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </Svg>
          <Text style={styles.bannerText}>{S.bannerEnable}</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => handleToggle(true)} activeOpacity={0.85}>
            <Text style={styles.bannerBtnText}>{S.bannerAction}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      ) : null}

      <LocationPicker visible={locationPickerVisible} onClose={handleClosePicker} onSelect={handleSelectLocation} currentLocation={currentLocation} />
    </SafeAreaView>
  );
}

const getStyles = (C, isDaytime) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.text, fontSize: 16, fontFamily: FONTS.sans },
  scrollView: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 132, backgroundColor: C.bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14,
  },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 7, direction: 'rtl' },
  wordmark: { fontFamily: FONTS.arabic, fontSize: 30, fontWeight: '700', color: isDaytime ? C.green : C.goldBright, lineHeight: 38 },
  cityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderColor: C.goldFaint, borderWidth: 1, borderRadius: RADII.sm,
    backgroundColor: C.surface, paddingVertical: 7, paddingHorizontal: 12,
    boxShadow: C.raiseSm, maxWidth: '52%',
  },
  cityText: { fontFamily: FONTS.sans, fontSize: 12, color: C.text, writingDirection: 'rtl' },
  heroWrap: { paddingHorizontal: 20, paddingTop: 6 },
  archSlab: {
    backgroundColor: C.green,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: RADII.lg,
    borderBottomRightRadius: RADII.lg,
    boxShadow: C.raise,
    paddingTop: 34,
    paddingBottom: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  archFrame: {
    position: 'absolute', top: RULES.archFrameInset, bottom: RULES.archFrameInset,
    left: RULES.archFrameInset, right: RULES.archFrameInset,
    borderTopLeftRadius: 994, borderTopRightRadius: 994,
    borderBottomLeftRadius: RADII.md, borderBottomRightRadius: RADII.md,
    borderWidth: 1, borderColor: isDaytime ? 'rgba(224, 189, 114, 0.5)' : 'rgba(217, 184, 105, 0.55)',
  },
  archSkyField: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  glowSliver: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  crown: { marginBottom: 10, alignItems: 'center' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, maxWidth: 300, direction: 'rtl' },
  onGreenChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.18)', borderRadius: RADII.sm,
    paddingVertical: 6, paddingHorizontal: 12, maxWidth: '100%',
  },
  chipText: { fontFamily: FONTS.sans, fontSize: 11, color: C.onGreenMuted, writingDirection: 'rtl' },
  fridayChip: { backgroundColor: C.goldFaint },
  fridayText: { fontFamily: FONTS.sans, fontSize: 11, fontWeight: '700', color: C.goldBright, writingDirection: 'rtl' },
  heroLabel: { fontFamily: FONTS.sans, fontSize: TYPE.label, fontWeight: '600', color: C.onGreenMuted, textAlign: 'center' },
  heroPrayer: { fontFamily: FONTS.arabic, fontSize: TYPE.display, fontWeight: '700', color: C.onGreen, lineHeight: 50, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  countPanel: {
    backgroundColor: C.greenDeep,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.22)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    boxShadow: C.groove,
  },
  countdown: { fontFamily: FONTS.sans, fontSize: TYPE.hero, fontWeight: '600', color: C.goldBright, textAlign: 'center' },
  bandTrack: { width: '88%', height: RULES.band, marginTop: 12, borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.3)', overflow: 'hidden' },
  bandFill: { height: RULES.band, borderRadius: 4 },
  heroTime: { fontFamily: FONTS.sans, fontSize: 12, color: C.onGreenMuted, textAlign: 'center', marginTop: 8 },
  banner: { position: 'absolute', bottom: 128, left: 16, right: 16 },
  bannerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: RADII.lg, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.goldFaint,
    paddingVertical: 12, paddingHorizontal: 16,
    boxShadow: C.raise, width: '100%', maxWidth: 420, alignSelf: 'center',
  },
  bannerText: { flex: 1, fontFamily: FONTS.sans, fontSize: 12.5, color: C.text, writingDirection: 'rtl' },
  bannerBtn: { backgroundColor: C.green, paddingVertical: 9, paddingHorizontal: 20, borderRadius: RADII.md, borderWidth: 1, borderColor: C.goldFaint },
  bannerBtnText: { fontFamily: FONTS.sans, color: C.onGreen, fontSize: 12.4, fontWeight: '700', writingDirection: 'rtl' },
  footer: { paddingTop: 26, paddingBottom: 8, alignItems: 'center' },
  footerText: { fontFamily: FONTS.sans, fontSize: 11, color: C.textMuted, textAlign: 'center', writingDirection: 'rtl' },
});
