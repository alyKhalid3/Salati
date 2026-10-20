// src/screens/HomeScreen.js - exact web animation parity
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Easing,
  Platform,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { usePrayer } from '../context/PrayerContext';
import { useNotification } from '../context/NotificationContext';
import { formatTime, formatCountdown, getHijriDate, PRAYER_NAMES, getTimeUntil, resolveLocationTimeZone } from '../utils/prayerTimes';
import { getRandomMessage } from '../utils/messages';
import { schedulePrayerNotifications, cancelAllNotifications } from '../utils/notifications';
import { storageBackend } from '../utils/storage';
import PrayerRow from '../components/PrayerRow';
import WisdomCard from '../components/WisdomCard';
import StreakSummary from '../components/StreakSummary';
import CongratulationsModal from '../components/CongratulationsModal';
import LocationPicker from '../components/LocationPicker';
import { METHOD_LABELS } from '../utils/theme';

const REMINDER_OPTIONS = [5, 10, 15, 30];
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

function stripCountry(name) {
  if (!name) return 'القاهرة';
  return name
    .replace('، مصر','').replace('، السعودية','').replace('، الإمارات','')
    .replace('، قطر','').replace('، الكويت','').replace('، البحرين','')
    .replace('، عُمان','').replace('، تركيا','').replace('، المغرب','')
    .replace('، الجزائر','').replace('، تونس','').replace('، الأردن','')
    .replace('، لبنان','').replace('، السودان','').replace('، بريطانيا','').replace('، فرنسا','');
}

// Day arc: readable sun-path illustration (reference idea, our identity).
// Dotted horizon, prayer dots on the curve, sun/moon marker, dome
// silhouette — plus labelled ends and remaining caption below.
function DayArc({ fajr, sunrise, dhuhr, asr, maghrib, isha, now, timezone, C, atmo, nextName }) {
  const W = 320, H = 130, cy = 96, X0 = 26, X1 = 294, DAY_H = 80, NIGHT_D = 22;
  if (!(sunrise instanceof Date) || !(maghrib instanceof Date) || isNaN(sunrise) || isNaN(maghrib)) return null;
  const total = maghrib.getTime() - sunrise.getTime();
  if (!(total > 0)) return null;
  const valid = (t) => (t instanceof Date) && !isNaN(t);
  // Full connected span: fajr → isha (falls back to day arc when polar).
  const spanStart = valid(fajr) && fajr.getTime() < sunrise.getTime() ? fajr : sunrise;
  const spanEnd = valid(isha) && isha.getTime() > maghrib.getTime() ? isha : maghrib;
  const span = spanEnd.getTime() - spanStart.getTime();
  if (!(span > 0)) return null;
  const X = (t) => X0 + (X1 - X0) * ((t.getTime() - spanStart.getTime()) / span);
  const Y = (t) => {
    const ms = t.getTime();
    if (ms >= sunrise.getTime() && ms <= maghrib.getTime()) {
      return cy - DAY_H * Math.sin(Math.PI * (ms - sunrise.getTime()) / total);
    }
    if (ms < sunrise.getTime() && valid(fajr) && ms >= fajr.getTime()) {
      const u = (ms - fajr.getTime()) / (sunrise.getTime() - fajr.getTime());
      return cy + NIGHT_D * Math.sin(Math.PI * u);
    }
    if (ms > maghrib.getTime() && valid(isha) && ms <= isha.getTime()) {
      const u = (ms - maghrib.getTime()) / (isha.getTime() - maghrib.getTime());
      return cy + NIGHT_D * Math.sin(Math.PI * u);
    }
    return cy;
  };
  // One continuous smooth path through the whole day.
  const N = 64;
  let d = '';
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const t = new Date(spanStart.getTime() + (span * i) / N);
    const x = X(t), y = Y(t);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    pts.push({ x, y });
  }
  // Fill length measured along the curve UP TO NOW (not total × fraction:
  // arc length and time don't advance at the same rate on a sine hump,
  // which is what let the glow end drift off the sun dot).
  const nowMs = now.getTime();
  const clampedNow = Math.min(Math.max(nowMs, spanStart.getTime()), spanEnd.getTime());
  const fNow = (clampedNow - spanStart.getTime()) / span;
  const fi = fNow * N;
  const i0 = Math.min(N - 1, Math.floor(fi));
  let fillLen = 0;
  for (let i = 1; i <= i0; i += 1) fillLen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const u = fi - i0;
  fillLen += u * Math.hypot(pts[i0 + 1].x - pts[i0].x, pts[i0 + 1].y - pts[i0].y);
  let plen = 0;
  for (let i = 1; i <= N; i += 1) plen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const raw = (nowMs - sunrise.getTime()) / total;
  const risen = raw > 0 && raw < 1;
  const nowT = new Date(Math.min(Math.max(nowMs, spanStart.getTime()), spanEnd.getTime()));
  const mx = X(nowT), my = Y(nowT);
  const dot = (t, key) => {
    if (!valid(t)) return null;
    if (t.getTime() < spanStart.getTime() || t.getTime() > spanEnd.getTime()) return null;
    const p = { x: X(t), y: Y(t) };
    const isNext = key === nextName;
    return (
      <React.Fragment key={key}>
        {isNext && <Circle cx={p.x} cy={p.y} r={6.5} fill="none" stroke={C.accent} strokeWidth={1.5} />}
        <Circle cx={p.x} cy={p.y} r={2.5} fill={isNext ? C.accent : C.textMuted} />
      </React.Fragment>
    );
  };
  let caption;
  if (raw < 0) {
    caption = `الشروق بعد ${formatCountdown(sunrise.getTime() - now.getTime())}`;
  } else if (raw > 1) {
    caption = `ليلاً · الشروق ${formatTime(sunrise, timezone)}`;
  } else {
    caption = `متبقي على الغروب ${formatCountdown(maghrib.getTime() - now.getTime())}`;
  }
  return (
    <View style={{ marginTop: 14, width: '100%', maxWidth: 340, alignSelf: 'center', alignItems: 'center' }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={8} y1={cy} x2={W - 8} y2={cy} stroke={`rgba(${C.paper}, 0.3)`} strokeWidth={1} strokeDasharray="1 5" strokeLinecap="round" />
        <Path d={`M148,${cy} v-5 a12,11 0 0 1 24,0 v5 z`} fill={C.textMuted} fillOpacity={0.28} />
        <Path d={`M141,${cy} v-15 M145,${cy} v-15 M175,${cy} v-15 M179,${cy} v-15 M160,${cy - 16} v-4`} stroke={C.textMuted} strokeOpacity={0.28} strokeWidth={1.5} />
        <Path d={d} stroke={`rgba(${C.paper}, 0.18)`} strokeWidth={1.5} fill="none" />
        <Path d={d} stroke={atmo.glow} strokeWidth={2} fill="none" strokeDasharray={`${fillLen} ${plen}`} strokeLinecap="round" />
        {dot(fajr, 'fajr')}{dot(dhuhr, 'dhuhr')}{dot(asr, 'asr')}{dot(maghrib, 'maghrib')}{dot(isha, 'isha')}
        {risen ? (
          <React.Fragment>
            <Circle cx={mx} cy={my} r={11} fill={atmo.glow} opacity={0.25} />
            <Circle cx={mx} cy={my} r={5.5} fill={atmo.glow} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Circle cx={160} cy={34} r={12} fill={atmo.glow} opacity={0.18} />
            <Circle cx={160} cy={34} r={7} fill={atmo.core} />
          </React.Fragment>
        )}
      </Svg>
      <Text style={{ fontFamily: 'Cairo', fontSize: 10.5, color: C.textSecondary, marginTop: 8, textAlign: 'center' }}>{caption}</Text>
    </View>
  );
}

// Memoized with a 30s bucket on `now`: the sun barely moves, but the
// caption ticks every second — this keeps per-second renders cheap.
const MemoDayArc = React.memo(DayArc, (p, n) => (
  p.fajr === n.fajr && p.sunrise === n.sunrise && p.dhuhr === n.dhuhr &&
  p.asr === n.asr && p.maghrib === n.maghrib && p.isha === n.isha &&
  p.timezone === n.timezone && p.C === n.C && p.atmo === n.atmo &&
  p.nextName === n.nextName &&
  Math.floor(p.now.getTime() / 30000) === Math.floor(n.now.getTime() / 30000)
));

// Isolated countdown: ticks in its own state so the 1s pulse re-renders
// only the digits — not HomeScreen, rows, and arc every second.
function CountdownText({ time, style, pulseOpacity }) {
  const [text, setText] = useState('00:00:00');
  useEffect(() => {
    if (!time) return undefined;
    setText(formatCountdown(getTimeUntil(time)));
    const id = setInterval(() => setText(formatCountdown(getTimeUntil(time))), 1000);
    return () => clearInterval(id);
  }, [time]);
  return <Animated.Text style={[style, { opacity: pulseOpacity }]}>{text}</Animated.Text>;
}

export default function HomeScreen({ navigation }) {
  const { 
    prayerTimes, tomorrowTimes, nextPrayer, currentPrayer, togglePrayed, isPrayed, getPrayerStreak,
    streaks, dailyStreak, bestDailyStreak, location: prayerLocation, setLocation: setPrayerLocation,
    madhab, setMadhab, isDaytime, C, phase, atmo, showCongratulations, hideCongratulations,
    locationDateKey,
  } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  // Daylight mode: hero glows follow the sky phase; dark keeps copper.
  const glowC = atmo.glow;
  const coreC = atmo.core;
  const auraAC = atmo.auraA;
  const auraBC = atmo.auraB;
  const ao = atmo.o || 1;
  const { notificationsEnabled, setNotificationsEnabled, reminderMinutes, setReminderMinutes, recurringReminders, ready: notificationsReady } = useNotification();

  const [message, setMessage] = useState(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [madhabPickerVisible, setMadhabPickerVisible] = useState(false);

  // Entrance animations - web timings
  const topbarOpacity = useRef(new Animated.Value(0)).current;
  const topbarY = useRef(new Animated.Value(-20)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(20)).current;
  const accentScale = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const dividerY = useRef(new Animated.Value(20)).current;
  const dividerLineScale = useRef(new Animated.Value(0)).current;
  const settingsOpacity = useRef(new Animated.Value(0)).current;
  const settingsY = useRef(new Animated.Value(20)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerY = useRef(new Animated.Value(20)).current;
  const bannerY = useRef(new Animated.Value(100)).current;

  // Infinite animations
  const breatheOpacity = useRef(new Animated.Value(0.6)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  // Aurora drift + accent shimmer
  const auroraAX = useRef(new Animated.Value(0)).current;
  const auroraAY = useRef(new Animated.Value(0)).current;
  const auroraBX = useRef(new Animated.Value(0)).current;
  const auroraBY = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-30)).current;

  const currentLocation = prayerLocation || { latitude: 30.0444, longitude: 31.2357, name: 'القاهرة، مصر', method: 'Egyptian', timezone: 'Africa/Cairo', useDeviceTimezone: false };
  const displayTimezone = resolveLocationTimeZone(currentLocation);
  const hijri = React.useMemo(() => getHijriDate(new Date(), displayTimezone), [locationDateKey, displayTimezone]);
  const heroMethodLabel = METHOD_LABELS[currentLocation.method] || '';
  const heroMadhabLabel = madhab === 'Hanafi' ? 'حنفي' : 'شافعي';

  useEffect(() => {
    (async () => {
      const s = await storageBackend.getSettings();
      // Web: also check Notification permission like web does
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default' && s.notificationsEnabled) setBannerVisible(true);
        else if (!s.notificationsEnabled) setBannerVisible(true);
        else setBannerVisible(false);
      } else {
        if (!s.notificationsEnabled) setBannerVisible(true);
      }
    })();
  }, []);

  useEffect(() => {
    // Entrance sequence matching web: topbar 0.6s, hero 0.8s 0.1s, accent 1s 0.4s, divider 0.6s 0.3s + line 0.8s 0.5s, settings 0.6s 0.8s, footer 0.6s 0.9s
    // All animations are stopped on unmount: orphaned native nodes crash the
    // native animated manager on reload (connect/disconnectAnimatedNodes).
    const entrance = Animated.parallel([
      Animated.timing(topbarOpacity, { toValue: 1, duration: 600, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(topbarY, { toValue: 0, duration: 600, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 800, delay: 100, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(heroY, { toValue: 0, duration: 800, delay: 100, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(accentScale, { toValue: 1, duration: 1000, delay: 400, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(dividerOpacity, { toValue: 1, duration: 600, delay: 300, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(dividerY, { toValue: 0, duration: 600, delay: 300, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(dividerLineScale, { toValue: 1, duration: 800, delay: 500, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(settingsOpacity, { toValue: 1, duration: 600, delay: 800, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(settingsY, { toValue: 0, duration: 600, delay: 800, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(footerOpacity, { toValue: 1, duration: 600, delay: 900, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(footerY, { toValue: 0, duration: 600, delay: 900, easing: EASE_OUT, useNativeDriver: true }),
    ]);
    entrance.start();

    // Infinite: breathe 4s ease-in-out, pulse 2s ease-in-out
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breatheOpacity, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(breatheScale, { toValue: 1.05, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(breatheOpacity, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(breatheScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    breathe.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.85, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Slow aurora drift: two light orbs gliding on different periods
    const drift = (node, from, to, duration) => Animated.loop(
      Animated.sequence([
        Animated.timing(node, { toValue: to, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(node, { toValue: from, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const auroras = [
      drift(auroraAX, 0, 18, 9000), drift(auroraAY, 0, -14, 12000),
      drift(auroraBX, 0, -20, 11000), drift(auroraBY, 0, 16, 8000),
    ];
    auroras.forEach((a) => a.start());

    // Sheen sweeping across the accent line
    const shimmer = Animated.loop(
      Animated.timing(shimmerX, { toValue: 110, duration: 2600, easing: Easing.linear, useNativeDriver: true })
    );
    shimmer.start();

    setMessage(getRandomMessage('quran'));
    return () => { entrance.stop(); breathe.stop(); pulse.stop(); auroras.forEach((a) => a.stop()); shimmer.stop(); };
  }, []);

  useEffect(() => {
    // Scheduling ~80 notifications serially is slow: let first paint win,
    // then schedule once interactions settle.
    if (!prayerTimes || !notificationsReady) return undefined;
    const task = InteractionManager.runAfterInteractions(() => { scheduleAll(); });
    return () => task.cancel();
  }, [prayerTimes, tomorrowTimes, reminderMinutes, notificationsEnabled, recurringReminders, notificationsReady]);
  useEffect(() => {
    Animated.timing(bannerY, { toValue: bannerVisible ? 0 : 100, duration: 350, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [bannerVisible]);

  const scheduleAll = async () => {
    if (!prayerTimes) return;
    // Turning notifications off must also clear anything already scheduled
    if (!notificationsEnabled) { await cancelAllNotifications(); return; }
    // Schedule today's remaining prayers + all of tomorrow so the day after
    // is covered even if the app stays closed past midnight. Both day sets use
    // absolute Adhan instants with their own location-calendar day keys.
    const days = [prayerTimes, tomorrowTimes];
    for (const times of days) {
      if (!times) continue;
      for (const p of ['fajr','dhuhr','asr','maghrib','isha']) {
        if (times[p]) await schedulePrayerNotifications(p, times[p], reminderMinutes, { recurring: recurringReminders, day: times.dateKey });
      }
    }
  };

  const handleClosePicker = useCallback(() => setLocationPickerVisible(false), []);
  const handleSelectLocation = useCallback(async (loc) => {
    if (setPrayerLocation) await setPrayerLocation(loc);
    else {
      const s = await storageBackend.getSettings();
      await storageBackend.saveSettings({ ...s, location: loc });
    }
  }, [setPrayerLocation]);
  const handleToggle = async (v) => {
    if (v && Platform.OS !== 'web') {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          // Permission denied, but still enable in settings
          setNotificationsEnabled(true);
          setBannerVisible(false);
          return;
        }
      } catch {}
    } else if (v && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setNotificationsEnabled(true);
          setBannerVisible(false);
          return;
        }
      } catch {}
    }
    setNotificationsEnabled(v);
    setBannerVisible(!v);
  };
  const handleReminder = (m) => {
    setReminderMinutes(m);
    setReminderPickerVisible(false);
  };
  const handleMadhab = (value) => {
    setMadhab(value);
    setMadhabPickerVisible(false);
  };
  const madhabLabel = madhab === 'Hanafi' ? 'حنفي' : 'شافعي';

  if (!prayerTimes || !nextPrayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { fontFamily: 'Cairo' }]}>جاري تحميل مواقيت الصلاة...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.topbar, { opacity: topbarOpacity, transform: [{ translateY: topbarY }] }]}>
          <Text style={styles.topbarTitle}>صلاتي</Text>
          <View style={styles.topbarLeft}>
          <TouchableOpacity style={styles.topbarLocation} onPress={() => setLocationPickerVisible(true)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`تغيير الموقع: ${currentLocation.name}`}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={2}>
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx={12} cy={10} r={3} />
            </Svg>
            <Text style={styles.topbarLocationText} numberOfLines={1}>{stripCountry(currentLocation.name)}</Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth={2}><Path d="M6 9l6 6 6-6" /></Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topbarGear} onPress={() => navigation && navigation.navigate('Settings')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="الإعدادات">
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth={1.8}>
              <Circle cx={12} cy={12} r={3} />
              <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </Svg>
          </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroY }] }]}>
          <Animated.View pointerEvents="none" style={[styles.heroGlowContainer, { opacity: breatheOpacity, transform: [{ scale: breatheScale }] }]}>
            <Svg width={300} height={300} viewBox="0 0 300 300" style={styles.heroGlowSvg}>
              <Defs>
                <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={glowC} stopOpacity={0.10 * ao} />
                  <Stop offset="55%" stopColor={glowC} stopOpacity={0.035 * ao} />
                  <Stop offset="80%" stopColor={glowC} stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="core" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={coreC} stopOpacity={0.10 * ao} />
                  <Stop offset="100%" stopColor={coreC} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={150} cy={150} r={150} fill="url(#glow)" />
              <Circle cx={150} cy={150} r={70} fill="url(#core)" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.aurora, styles.auroraA, { transform: [{ translateX: auroraAX }, { translateY: auroraAY }] }]} pointerEvents="none">
            <Svg width={220} height={220} viewBox="0 0 220 220">
              <Defs>
                <RadialGradient id="auroraA" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={auraAC} stopOpacity={0.12 * ao} />
                  <Stop offset="100%" stopColor={auraAC} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={110} cy={110} r={110} fill="url(#auroraA)" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.aurora, styles.auroraB, { transform: [{ translateX: auroraBX }, { translateY: auroraBY }] }]} pointerEvents="none">
            <Svg width={260} height={260} viewBox="0 0 260 260">
              <Defs>
                <RadialGradient id="auroraB" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={auraBC} stopOpacity={0.08 * ao} />
                  <Stop offset="100%" stopColor={auraBC} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={130} cy={130} r={130} fill="url(#auroraB)" />
            </Svg>
          </Animated.View>
          <View style={styles.heroLabelRow}>
            <View style={styles.heroRule} />
            <Text style={styles.heroLabel}>الصلاة القادمة</Text>
            <View style={styles.heroRule} />
          </View>
          <View style={styles.heroPrayerWrap}>
            <Text style={styles.heroPrayer}>{PRAYER_NAMES[nextPrayer.name]}</Text>
            <View style={styles.heroAccentWrap}>
              <Animated.View style={[styles.heroAccent, { transform: [{ scaleX: accentScale }] }]} />
              <Animated.View style={[styles.heroShimmer, { transform: [{ translateX: shimmerX }] }]} />
            </View>
          </View>
          <View style={styles.heroCountdownPanel}>
            <CountdownText time={nextPrayer.time} style={styles.heroCountdown} pulseOpacity={pulseOpacity} />
          </View>
          <Text style={styles.heroTime}>{formatTime(nextPrayer.time, displayTimezone)}</Text>
          {(
            <MemoDayArc fajr={prayerTimes?.fajr} sunrise={prayerTimes?.sunrise} dhuhr={prayerTimes?.dhuhr} asr={prayerTimes?.asr} maghrib={prayerTimes?.maghrib} isha={prayerTimes?.isha} now={new Date()} timezone={displayTimezone} C={C} atmo={atmo} nextName={nextPrayer.name} />
          )}
          {!!heroMethodLabel && <Text style={styles.heroMeta}>{heroMethodLabel} · {heroMadhabLabel} · {phase.icon} {phase.label}</Text>}
          {!!hijri && <Text style={styles.hijri}>{hijri}</Text>}
        </Animated.View>

        <StreakSummary streaks={streaks} dailyStreak={dailyStreak} bestDailyStreak={bestDailyStreak} />

        <Animated.View style={[styles.divider, { opacity: dividerOpacity, transform: [{ translateY: dividerY }] }]}>
          <Animated.View style={[styles.dividerLine, { transform: [{ scaleX: dividerLineScale }] }]} />
          <Text style={styles.dividerText}>◆ مواقيت اليوم ◆</Text>
          <Animated.View style={[styles.dividerLine, { transform: [{ scaleX: dividerLineScale }] }]} />
        </Animated.View>

        <View style={styles.prayerList}>
          {['fajr','sunrise','dhuhr','asr','maghrib','isha'].map((p,i)=>{
            const isLocked = p === 'sunrise' || (prayerTimes[p] && prayerTimes[p] > new Date());
            return (
              <PrayerRow key={p} name={p} time={formatTime(prayerTimes[p], displayTimezone)} isActive={currentPrayer===p} isPrayed={isPrayed(p)} streak={getPrayerStreak(p)} onTogglePrayed={togglePrayed} delay={350+i*50} isLocked={isLocked} />
            );
          })}
        </View>

        {message && <WisdomCard message={message} />}

        <Animated.View style={[styles.settings, { opacity: settingsOpacity, transform: [{ translateY: settingsY }] }]}>
          <View style={styles.settingRow}>
            <Text style={styles.settingName}>تنبيهات الصلاة</Text>
            <Switch value={notificationsEnabled} onValueChange={handleToggle} trackColor={{ false: C.surface, true: C.accent }} thumbColor={notificationsEnabled ? C.bg : C.textSecondary} ios_backgroundColor="#1a1a1a" />
          </View>
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <Text style={styles.settingName}>تنبيه قبل الصلاة</Text>
            <TouchableOpacity style={styles.select} onPress={() => setReminderPickerVisible(!reminderPickerVisible)} activeOpacity={0.7}>
              <Text style={styles.selectText}>{reminderMinutes} دقائق</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth={2}><Path d="M6 9l6 6 6-6" /></Svg>
            </TouchableOpacity>
          </View>
          {reminderPickerVisible && (
            <View style={styles.selectDropdown}>
              {REMINDER_OPTIONS.map(m=>(
                <TouchableOpacity key={m} style={[styles.selectOption, reminderMinutes===m && styles.selectOptionActive]} onPress={()=>handleReminder(m)}>
                  <Text style={[styles.selectOptionText, reminderMinutes===m && styles.selectOptionTextActive]}>{m} دقائق</Text>
                  {reminderMinutes===m && <Text style={styles.selectCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <Text style={styles.settingName}>حساب العصر</Text>
            <TouchableOpacity style={styles.select} onPress={() => setMadhabPickerVisible(!madhabPickerVisible)} activeOpacity={0.7}>
              <Text style={styles.selectText}>{madhabLabel}</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textSecondary} strokeWidth={2}><Path d="M6 9l6 6 6-6" /></Svg>
            </TouchableOpacity>
          </View>
          {madhabPickerVisible && (
            <View style={styles.selectDropdown}>
              {[['Shafi','شافعي'],['Hanafi','حنفي']].map(([value,label])=>(
                <TouchableOpacity key={value} style={[styles.selectOption, madhab===value && styles.selectOptionActive]} onPress={()=>handleMadhab(value)}>
                  <Text style={[styles.selectOptionText, madhab===value && styles.selectOptionTextActive]}>{label}</Text>
                  {madhab===value && <Text style={styles.selectCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: footerOpacity, transform: [{ translateY: footerY }] }]}>
          <Text style={styles.footerDiamond}>◆</Text>
          <Text style={styles.footerText}>صلاتي — ليكن قلبك مع الله</Text>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.banner, { transform: [{ translateY: bannerY }] }]}>
        <View style={styles.bannerInner}>
          <Text style={styles.bannerIcon}>🔔</Text>
          <Text style={styles.bannerText}>فعّل التنبيهات لتذكيرك بالصلاة</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => handleToggle(true)} activeOpacity={0.85}>
            <Text style={styles.bannerBtnText}>تفعيل</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <LocationPicker visible={locationPickerVisible} onClose={handleClosePicker} onSelect={handleSelectLocation} currentLocation={currentLocation} />
      <CongratulationsModal visible={showCongratulations} dailyStreak={dailyStreak} onClose={hideCongratulations} />
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadingText: { color: C.text, fontSize: 16, fontFamily: 'Cairo' },
  scrollView: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 80, backgroundColor: C.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, backgroundColor: C.bg, direction: 'rtl' },
  topbarTitle: { fontFamily: 'Amiri', fontSize: 22.4, fontWeight: '700', color: C.text, writingDirection: 'rtl' },
  topbarLeft: { flexDirection: 'row', flexShrink: 1, marginStart: 16, alignItems: 'center', gap: 10, direction: 'rtl' },
  topbarGear: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  topbarLocation: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, minHeight: 48, gap: 6, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, direction: 'rtl' },
  topbarLocationText: { flexShrink: 1, fontFamily: 'Cairo', fontSize: 12, color: C.textSecondary, writingDirection: 'rtl' },
  hero: { paddingTop: 32, paddingBottom: 36, paddingHorizontal: 24, alignItems: 'center', backgroundColor: C.bg, position: 'relative', overflow: 'hidden', justifyContent: 'center' },
  heroGlowContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  heroGlowSvg: { width: 300, height: 300 },
  heroLabel: { fontFamily: 'Cairo', fontSize: 12, fontWeight: '600', color: C.textSecondary, textAlign: 'center', writingDirection: 'rtl' },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12, direction: 'rtl' },
  heroRule: { width: 44, height: 1, backgroundColor: 'rgba(212, 149, 106, 0.35)' },
  heroMeta: { fontFamily: 'Cairo', fontSize: 11, lineHeight: 20, color: C.textSecondary, marginTop: 10, textAlign: 'center', writingDirection: 'rtl' },
  hijri: { fontFamily: 'Cairo', fontSize: 12, color: C.textSecondary, marginTop: 6, textAlign: 'center', writingDirection: 'rtl' },
  heroPrayerWrap: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  heroPrayer: { fontFamily: 'Amiri', fontSize: 66, fontWeight: '700', color: C.text, lineHeight: 72, textAlign: 'center', writingDirection: 'rtl', textShadowColor: C.textShadow, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 2 },
  aurora: { position: 'absolute' },
  auroraA: { top: -30, left: -70 },
  auroraB: { bottom: -70, right: -80 },
  heroAccentWrap: { marginTop: 4, width: 80, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(212,149,106,0.16)' },
  heroShimmer: { position: 'absolute', top: 0, bottom: 0, width: 26, backgroundColor: 'rgba(255,244,224,0.45)', borderRadius: 2 },
  heroCountdownPanel: {
    backgroundColor: C.panel,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 26,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.panelBorder,
    borderTopColor: `rgba(${C.paper}, 0.16)`,
    shadowColor: C.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  heroCountdown: { fontFamily: 'Cairo', fontSize: 40, fontWeight: '200', color: C.accent, fontVariant: ['tabular-nums'], letterSpacing: 5, textAlign: 'center', writingDirection: 'ltr', textShadowColor: 'rgba(212, 149, 106, 0.45)', textShadowRadius: 16 },
  heroTime: { fontFamily: 'Cairo', fontSize: 12.8, color: C.textSecondary, letterSpacing: 2, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginVertical: 24, gap: 16, backgroundColor: C.bg, direction: 'rtl' },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.surface },
  dividerText: { fontFamily: 'Cairo', fontSize: 9.6, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', color: C.textMuted, paddingHorizontal: 4, writingDirection: 'rtl' },
  prayerList: { paddingHorizontal: 24, backgroundColor: C.bg, direction: 'rtl' },
  settings: { backgroundColor: C.surface2, marginHorizontal: 24, marginTop: 16, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 8, borderWidth: 1, borderColor: `rgba(${C.paper}, 0.06)`, borderTopColor: `rgba(${C.paper}, 0.13)` },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, gap: 16, direction: 'rtl' },
  settingRowBorder: { borderTopWidth: 1, borderTopColor: `rgba(${C.paper}, 0.06)` },
  settingName: { fontFamily: 'Cairo', fontSize: 13.6, color: C.text, writingDirection: 'rtl' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: `rgba(${C.paper}, 0.08)`, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, minWidth: 90, justifyContent: 'center' },
  selectText: { fontFamily: 'Cairo', fontSize: 12.8, color: C.text, writingDirection: 'rtl' },
  selectDropdown: { backgroundColor: C.surface, borderRadius: 8, marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  selectOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  selectOptionActive: { backgroundColor: 'rgba(212,149,106,0.15)' },
  selectOptionText: { fontFamily: 'Cairo', fontSize: 13, color: C.textSecondary, writingDirection: 'rtl' },
  selectOptionTextActive: { color: C.accent, fontWeight: '600' },
  selectCheck: { color: C.accent, fontSize: 12, fontWeight: '700' },
  footer: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', backgroundColor: C.bg },
  footerDiamond: { fontSize: 9, color: C.accent, opacity: 0.7, marginBottom: 10, textAlign: 'center' },
  footerText: { fontFamily: 'Cairo', fontSize: 11.2, color: C.textMuted, letterSpacing: 2, textAlign: 'center', writingDirection: 'rtl' },
  banner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface2, borderTopWidth: 1, borderTopColor: 'rgba(212, 149, 106, 0.25)', paddingVertical: 16, paddingHorizontal: 24 },
  bannerInner: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 420, alignSelf: 'center', width: '100%', direction: 'rtl' },
  bannerIcon: { fontSize: 15, opacity: 0.9 },
  bannerText: { flex: 1, fontFamily: 'Cairo', fontSize: 12.8, color: C.text, textAlign: 'right', writingDirection: 'rtl' },
  bannerBtn: { backgroundColor: C.accent, paddingVertical: 8, paddingHorizontal: 24, borderRadius: 4 },
  bannerBtnText: { fontFamily: 'Cairo', color: C.bg, fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
});
