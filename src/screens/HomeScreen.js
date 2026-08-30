// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrayer } from '../context/PrayerContext';
import { formatTime, formatCountdown, PRAYER_NAMES, getTimeUntil } from '../utils/prayerTimes';
import { getRandomMessage } from '../utils/messages';
import { schedulePrayerNotifications } from '../utils/notifications';
import PrayerRow from '../components/PrayerRow';
import WisdomCard from '../components/WisdomCard';
import StreakSummary from '../components/StreakSummary';
import CongratulationsModal from '../components/CongratulationsModal';

export default function HomeScreen({ navigation }) {
  const { 
    prayerTimes, 
    nextPrayer, 
    currentPrayer, 
    togglePrayed,
    isPrayed, 
    getPrayerStreak,
    streaks,
    dailyStreak,
    showCongratulations,
    hideCongratulations,
  } = usePrayer();
  const [countdown, setCountdown] = useState('00:00:00');
  const [message, setMessage] = useState(null);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      if (nextPrayer) {
        const timeLeft = getTimeUntil(nextPrayer.time);
        setCountdown(formatCountdown(timeLeft));
      }
    }, 1000);

    setMessage(getRandomMessage('quran'));

    return () => clearInterval(interval);
  }, [nextPrayer]);

  useEffect(() => {
    // Schedule notifications when prayer times are loaded
    if (prayerTimes) {
      scheduleAllNotifications();
    }
  }, [prayerTimes]);

  const scheduleAllNotifications = async () => {
    if (!prayerTimes) return;
    
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const prayer of prayers) {
      await schedulePrayerNotifications(
        PRAYER_NAMES[prayer],
        prayerTimes[prayer],
        10
      );
    }
  };

  if (!prayerTimes || !nextPrayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل مواقيت الصلاة...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>صلاتي</Text>
          <Text style={styles.location}>📍 القاهرة، مصر</Text>
        </Animated.View>

        {/* Hero - Next Prayer */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <Text style={styles.heroLabel}>الصلاة القادمة</Text>
          <Text style={styles.heroPrayer}>{PRAYER_NAMES[nextPrayer.name]}</Text>
          <Text style={styles.heroCountdown}>{countdown}</Text>
          <Text style={styles.heroTime}>{formatTime(nextPrayer.time)}</Text>
        </Animated.View>

        {/* Streak Summary */}
        <StreakSummary streaks={streaks} dailyStreak={dailyStreak} />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>مواقيت اليوم</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Prayer List */}
        <View style={styles.prayerList}>
          {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((prayer, index) => (
            <PrayerRow
              key={prayer}
              name={prayer}
              time={formatTime(prayerTimes[prayer])}
              isActive={currentPrayer === prayer}
              isPrayed={isPrayed(prayer)}
              streak={getPrayerStreak(prayer)}
              onTogglePrayed={togglePrayed}
              delay={index * 100}
            />
          ))}
        </View>

        {/* Wisdom Card */}
        {message && <WisdomCard message={message} />}

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsButtonText}>⚙️ الإعدادات</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>صلاتي — ليكن قلبك مع الله</Text>
        </View>
      </ScrollView>

      {/* Congratulations Modal */}
      <CongratulationsModal
        visible={showCongratulations}
        dailyStreak={dailyStreak}
        onClose={hideCongratulations}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f0ece4',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Amiri',
    fontSize: 28,
    fontWeight: '700',
    color: '#f0ece4',
  },
  location: {
    fontSize: 12,
    color: '#8a857a',
  },
  hero: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: '#4a4740',
    marginBottom: 8,
  },
  heroPrayer: {
    fontFamily: 'Amiri',
    fontSize: 56,
    fontWeight: '700',
    color: '#f0ece4',
    marginBottom: 16,
  },
  heroCountdown: {
    fontSize: 36,
    fontWeight: '200',
    color: '#d4956a',
    fontVariant: ['tabular-nums'],
    letterSpacing: 6,
    marginBottom: 4,
  },
  heroTime: {
    fontSize: 14,
    color: '#8a857a',
    letterSpacing: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1a1a1a',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#4a4740',
    paddingHorizontal: 16,
  },
  prayerList: {
    paddingHorizontal: 24,
  },
  settingsButton: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#141414',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#8a857a',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#4a4740',
    letterSpacing: 2,
  },
});
