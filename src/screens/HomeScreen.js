// src/screens/HomeScreen.js - exact web animation parity
import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { usePrayer } from '../context/PrayerContext';
import { useNotification } from '../context/NotificationContext';
import { formatTime, formatCountdown, PRAYER_NAMES, getTimeUntil, resolveLocationTimeZone } from '../utils/prayerTimes';
import { getRandomMessage } from '../utils/messages';
import { schedulePrayerNotifications, cancelAllNotifications } from '../utils/notifications';
import { storageBackend } from '../utils/storage';
import PrayerRow from '../components/PrayerRow';
import WisdomCard from '../components/WisdomCard';
import StreakSummary from '../components/StreakSummary';
import CongratulationsModal from '../components/CongratulationsModal';
import LocationPicker from '../components/LocationPicker';

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

export default function HomeScreen() {
  const { 
    prayerTimes, tomorrowTimes, nextPrayer, currentPrayer, togglePrayed, isPrayed, getPrayerStreak,
    streaks, dailyStreak, bestDailyStreak, location: prayerLocation, setLocation: setPrayerLocation,
    madhab, setMadhab, showCongratulations, hideCongratulations,
  } = usePrayer();
  const { notificationsEnabled, setNotificationsEnabled, reminderMinutes, setReminderMinutes, recurringReminders, ready: notificationsReady } = useNotification();

  const [countdown, setCountdown] = useState('00:00:00');
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

  const currentLocation = prayerLocation || { latitude: 30.0444, longitude: 31.2357, name: 'القاهرة، مصر', method: 'Egyptian', timezone: 'Africa/Cairo', useDeviceTimezone: false };
  const displayTimezone = resolveLocationTimeZone(currentLocation);

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
      Animated.timing(topbarOpacity, { toValue: 1, duration: 600, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(topbarY, { toValue: 0, duration: 600, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 800, delay: 100, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(heroY, { toValue: 0, duration: 800, delay: 100, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(accentScale, { toValue: 1, duration: 1000, delay: 400, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(dividerOpacity, { toValue: 1, duration: 600, delay: 300, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(dividerY, { toValue: 0, duration: 600, delay: 300, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(dividerLineScale, { toValue: 1, duration: 800, delay: 500, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(settingsOpacity, { toValue: 1, duration: 600, delay: 800, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(settingsY, { toValue: 0, duration: 600, delay: 800, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(footerOpacity, { toValue: 1, duration: 600, delay: 900, easing: EASE_OUT, useNativeDriver: false }),
      Animated.timing(footerY, { toValue: 0, duration: 600, delay: 900, easing: EASE_OUT, useNativeDriver: false }),
    ]);
    entrance.start();

    // Infinite: breathe 4s ease-in-out, pulse 2s ease-in-out
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breatheOpacity, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(breatheScale, { toValue: 1.05, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(breatheOpacity, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(breatheScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
      ])
    );
    breathe.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.85, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseOpacity, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    pulse.start();

    setMessage(getRandomMessage('quran'));
    return () => { entrance.stop(); breathe.stop(); pulse.stop(); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (nextPrayer) setCountdown(formatCountdown(getTimeUntil(nextPrayer.time)));
    }, 1000);
    return () => clearInterval(id);
  }, [nextPrayer]);

  useEffect(() => {
    if (prayerTimes && notificationsReady) scheduleAll();
  }, [prayerTimes, tomorrowTimes, reminderMinutes, notificationsEnabled, recurringReminders, notificationsReady]);
  useEffect(() => {
    Animated.timing(bannerY, { toValue: bannerVisible ? 0 : 100, duration: 350, easing: EASE_OUT, useNativeDriver: false }).start();
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

  const handleSelectLocation = async (loc) => {
    if (setPrayerLocation) await setPrayerLocation(loc);
    else {
      const s = await storageBackend.getSettings();
      await storageBackend.saveSettings({ ...s, location: loc });
    }
  };
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
          <TouchableOpacity style={styles.topbarLocation} onPress={() => setLocationPickerVisible(true)} activeOpacity={0.8}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#d4956a" strokeWidth={2}>
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx={12} cy={10} r={3} />
            </Svg>
            <Text style={styles.topbarLocationText}>{stripCountry(currentLocation.name)}</Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#4a4740" strokeWidth={2}><Path d="M6 9l6 6 6-6" /></Svg>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroY }] }]}>
          <Animated.View style={[styles.heroGlowContainer, { opacity: breatheOpacity, transform: [{ scale: breatheScale }] }]}>
            <Svg width={280} height={280} viewBox="0 0 280 280" style={styles.heroGlowSvg}>
              <Defs>
                <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#d4956a" stopOpacity={0.08} />
                  <Stop offset="70%" stopColor="#d4956a" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={140} cy={140} r={140} fill="url(#glow)" />
            </Svg>
          </Animated.View>
          <Text style={styles.heroLabel}>الصلاة القادمة</Text>
          <View style={styles.heroPrayerWrap}>
            <Text style={styles.heroPrayer}>{PRAYER_NAMES[nextPrayer.name]}</Text>
            <Animated.View style={[styles.heroAccent, { transform: [{ scaleX: accentScale }] }]} />
          </View>
          <Animated.Text style={[styles.heroCountdown, { opacity: pulseOpacity }]}>{countdown}</Animated.Text>
          <Text style={styles.heroTime}>{formatTime(nextPrayer.time, displayTimezone)}</Text>
        </Animated.View>

        <StreakSummary streaks={streaks} dailyStreak={dailyStreak} bestDailyStreak={bestDailyStreak} />

        <Animated.View style={[styles.divider, { opacity: dividerOpacity, transform: [{ translateY: dividerY }] }]}>
          <Animated.View style={[styles.dividerLine, { transform: [{ scaleX: dividerLineScale }] }]} />
          <Text style={styles.dividerText}>مواقيت اليوم</Text>
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
            <Switch value={notificationsEnabled} onValueChange={handleToggle} trackColor={{ false: '#1a1a1a', true: '#d4956a' }} thumbColor={notificationsEnabled ? '#0a0a0a' : '#8a857a'} ios_backgroundColor="#1a1a1a" />
          </View>
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <Text style={styles.settingName}>تنبيه قبل الصلاة</Text>
            <TouchableOpacity style={styles.select} onPress={() => setReminderPickerVisible(!reminderPickerVisible)} activeOpacity={0.7}>
              <Text style={styles.selectText}>{reminderMinutes} دقائق</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#8a857a" strokeWidth={2}><Path d="M6 9l6 6 6-6" /></Svg>
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
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#8a857a" strokeWidth={2}><Path d="M6 9l6 6 6-6" /></Svg>
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
          <Text style={styles.footerText}>صلاتي — ليكن قلبك مع الله</Text>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.banner, { transform: [{ translateY: bannerY }] }]}>
        <View style={styles.bannerInner}>
          <Text style={styles.bannerText}>فعّل التنبيهات لتذكيرك بالصلاة</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => handleToggle(true)} activeOpacity={0.85}>
            <Text style={styles.bannerBtnText}>تفعيل</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <LocationPicker visible={locationPickerVisible} onClose={()=>setLocationPickerVisible(false)} onSelect={handleSelectLocation} currentLocation={currentLocation} />
      <CongratulationsModal visible={showCongratulations} dailyStreak={dailyStreak} onClose={hideCongratulations} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#f0ece4', fontSize: 16, fontFamily: 'Cairo' },
  scrollView: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { paddingBottom: 80, backgroundColor: '#0a0a0a' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, backgroundColor: '#0a0a0a', direction: 'rtl' },
  topbarTitle: { fontFamily: 'Amiri', fontSize: 22.4, fontWeight: '700', color: '#f0ece4', writingDirection: 'rtl' },
  topbarLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'transparent', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, direction: 'rtl' },
  topbarLocationText: { fontFamily: 'Cairo', fontSize: 12, color: '#8a857a', writingDirection: 'rtl' },
  hero: { paddingVertical: 64, paddingHorizontal: 24, alignItems: 'center', backgroundColor: '#0a0a0a', position: 'relative', overflow: 'hidden', justifyContent: 'center' },
  heroGlowContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  heroGlowSvg: { width: 280, height: 280 },
  heroLabel: { fontFamily: 'Cairo', fontSize: 10.4, fontWeight: '700', letterSpacing: 4, textTransform: 'uppercase', color: '#4a4740', marginBottom: 8, textAlign: 'center', writingDirection: 'rtl' },
  heroPrayerWrap: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  heroPrayer: { fontFamily: 'Amiri', fontSize: 60.8, fontWeight: '700', color: '#f0ece4', lineHeight: 66, textAlign: 'center', writingDirection: 'rtl' },
  heroAccent: { marginTop: 4, width: 80, height: 3, backgroundColor: '#d4956a', borderRadius: 2 },
  heroCountdown: { fontFamily: 'Cairo', fontSize: 38.4, fontWeight: '200', color: '#d4956a', fontVariant: ['tabular-nums'], letterSpacing: 6, marginBottom: 4, textAlign: 'center', writingDirection: 'ltr' },
  heroTime: { fontFamily: 'Cairo', fontSize: 12.8, color: '#8a857a', letterSpacing: 2, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginVertical: 24, gap: 16, backgroundColor: '#0a0a0a', direction: 'rtl' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1a1a1a' },
  dividerText: { fontFamily: 'Cairo', fontSize: 9.6, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', color: '#4a4740', paddingHorizontal: 4, writingDirection: 'rtl' },
  prayerList: { paddingHorizontal: 24, backgroundColor: '#0a0a0a', direction: 'rtl', contentVisibility: 'auto', containIntrinsicSize: '0 600px' },
  settings: { backgroundColor: '#141414', marginHorizontal: 24, marginTop: 16, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 8, contentVisibility: 'auto', containIntrinsicSize: '0 300px' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, gap: 16, direction: 'rtl' },
  settingRowBorder: { borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  settingName: { fontFamily: 'Cairo', fontSize: 13.6, color: '#f0ece4', writingDirection: 'rtl' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderRadius: 4, paddingVertical: 8, paddingHorizontal: 16, minWidth: 90, justifyContent: 'center' },
  selectText: { fontFamily: 'Cairo', fontSize: 12.8, color: '#f0ece4', writingDirection: 'rtl' },
  selectDropdown: { backgroundColor: '#1a1a1a', borderRadius: 8, marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  selectOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  selectOptionActive: { backgroundColor: 'rgba(212,149,106,0.15)' },
  selectOptionText: { fontFamily: 'Cairo', fontSize: 13, color: '#8a857a', writingDirection: 'rtl' },
  selectOptionTextActive: { color: '#d4956a', fontWeight: '600' },
  selectCheck: { color: '#d4956a', fontSize: 12, fontWeight: '700' },
  footer: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', backgroundColor: '#0a0a0a' },
  footerText: { fontFamily: 'Cairo', fontSize: 11.2, color: '#4a4740', letterSpacing: 2, textAlign: 'center', writingDirection: 'rtl' },
  banner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141414', borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingVertical: 16, paddingHorizontal: 24 },
  bannerInner: { flexDirection: 'row', alignItems: 'center', gap: 16, maxWidth: 420, alignSelf: 'center', width: '100%', direction: 'rtl' },
  bannerText: { flex: 1, fontFamily: 'Cairo', fontSize: 12.8, color: '#f0ece4', textAlign: 'right', writingDirection: 'rtl' },
  bannerBtn: { backgroundColor: '#d4956a', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 4 },
  bannerBtnText: { fontFamily: 'Cairo', color: '#0a0a0a', fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
});
