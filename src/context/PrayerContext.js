// src/context/PrayerContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  calculatePrayerTimes,
  calculateTomorrowPrayerTimes,
  getNextPrayer,
  getCurrentPrayer,
  getLocationDateKey,
  normalizeMadhab,
} from '../utils/prayerTimes';
import { storageBackend } from '../utils/storage';
import { cancelPrayerNotifications, schedulePrayerNotifications } from '../utils/notifications';
import { useNotification } from './NotificationContext';

const DAILY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PrayerContext = createContext();

export const PrayerProvider = ({ children, location: initialLocation }) => {
  const { reminderMinutes, recurringReminders } = useNotification();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [tomorrowTimes, setTomorrowTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [prayedStatus, setPrayedStatus] = useState({});
  const [streaks, setStreaks] = useState({});
  const [dailyStreak, setDailyStreak] = useState(0);
  const [bestDailyStreak, setBestDailyStreak] = useState(0);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [location, setLocationState] = useState(initialLocation || null);
  const [madhab, setMadhabState] = useState('Shafi');
  const [locationDateKey, setLocationDateKey] = useState(() => new Date().toDateString());

  // Sync prop changes (App.js GPS) into internal state
  useEffect(() => {
    if (initialLocation) setLocationState(initialLocation);
  }, [initialLocation?.latitude, initialLocation?.longitude]);

  // Load persisted location if no prop yet - validate lat/lng are numbers
  useEffect(() => {
    if (!location) {
      storageBackend.getSettings().then(s => {
        if (s.location && !isNaN(parseFloat(s.location.latitude)) && !isNaN(parseFloat(s.location.longitude))) {
          setLocationState(s.location);
        } else if (s.location) {
          // Corrupted storage (e.g., lat="Al May") - reset to Cairo
          setLocationState({ latitude: 30.0444, longitude: 31.2357, name: 'القاهرة، مصر', method: 'Egyptian', timezone: 'Africa/Cairo', useDeviceTimezone: false });
        }
      });
    }
  }, []);

  useEffect(() => {
    storageBackend.getSettings().then(s => {
      if (s && s.madhab) setMadhabState(normalizeMadhab(s.madhab));
    }).catch(() => {});
  }, []);

  const recomputeTimes = (loc, madhabValue, at = new Date()) => {
    if (!loc) return;
    const normalizedMadhab = normalizeMadhab(madhabValue);
    const dateKey = getLocationDateKey(loc, at);
    const times = calculatePrayerTimes(loc.latitude, loc.longitude, loc.method, loc.timezone, at, normalizedMadhab);
    const tomorrow = calculateTomorrowPrayerTimes(loc.latitude, loc.longitude, loc.method, loc.timezone, at, normalizedMadhab);
    setPrayerTimes(times);
    setTomorrowTimes(tomorrow);
    setNextPrayer(getNextPrayer(times, tomorrow, at));
    setCurrentPrayer(getCurrentPrayer(times, at));
    setLocationDateKey(dateKey);
    loadTodayData(dateKey);
  };

  useEffect(() => {
    if (location) {
      recomputeTimes(location, madhab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, madhab]);

  // Location-calendar day rollover and intraday next/current refresh. This uses
  // the selected location's calendar date, not necessarily the device date.
  const currentDayRef = useRef(locationDateKey);
  useEffect(() => {
    currentDayRef.current = locationDateKey;
  }, [locationDateKey]);
  useEffect(() => {
    if (!location) return undefined;
    const t = setInterval(() => {
      const now = new Date();
      const today = getLocationDateKey(location, now);
      if (today !== currentDayRef.current) {
        currentDayRef.current = today;
        recomputeTimes(location, madhab, now);
        return;
      }
      if (prayerTimes) {
        setNextPrayer(getNextPrayer(prayerTimes, tomorrowTimes, now));
        setCurrentPrayer(getCurrentPrayer(prayerTimes, now));
      }
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, madhab, prayerTimes, tomorrowTimes]);

  const setLocation = async (newLoc) => {
    setLocationState(newLoc);
    const settings = await storageBackend.getSettings();
    await storageBackend.saveSettings({ ...settings, location: newLoc });
  };

  const setMadhab = async (newMadhab) => {
    const normalized = normalizeMadhab(newMadhab);
    setMadhabState(normalized);
    const settings = await storageBackend.getSettings();
    await storageBackend.saveSettings({ ...settings, madhab: normalized });
  };

  const loadTodayData = async (dateKey) => {
    const targetDay = dateKey || locationDateKey;
    // Parallelize storage reads for faster startup
    const [prayed, allStreaks, ds, best] = await Promise.all([
      storageBackend.getPrayerStatus(targetDay),
      storageBackend.getAllStreaks(),
      storageBackend.getDailyStreak(),
      storageBackend.getBestDailyStreak(),
    ]);
    setPrayedStatus(prayed);
    setStreaks(allStreaks);
    setDailyStreak(ds);
    setBestDailyStreak(best);
  };

  const hideCongratulations = () => {
    setShowCongratulations(false);
  };

  const isPrayerTimePassed = (prayerName) => {
    if (prayerName === 'sunrise') return false;
    if (!prayerTimes || !prayerTimes[prayerName]) return false;
    return prayerTimes[prayerName] <= new Date();
  };

  const markAsPrayed = async (prayerName) => {
    if (prayerName === 'sunrise') return null;
    if (!isPrayerTimePassed(prayerName)) return null;
    try {
      const targetDay = prayerTimes?.dateKey || locationDateKey;
      await storageBackend.savePrayerStatus(prayerName, true, targetDay);
      const newStreak = await storageBackend.updateStreak(prayerName, targetDay);

      // Stop the "you haven't prayed" reminders for this prayer — only for
      // today's set, tomorrow's must stay armed
      await cancelPrayerNotifications(prayerName, targetDay);

      const newStatus = { ...prayedStatus, [prayerName]: { completed: true, timestamp: new Date().toISOString() } };
      setPrayedStatus(newStatus);
      setStreaks(prev => ({ ...prev, [prayerName]: newStreak }));
      
      const allPrayed = DAILY_PRAYERS.every(p => newStatus[p]?.completed);
      if (allPrayed) {
        const ds = await storageBackend.updateDailyStreak(targetDay);
        setDailyStreak(ds);
        const best = await storageBackend.getBestDailyStreak();
        setBestDailyStreak(best);
        setShowCongratulations(true);
      }
      
      return newStreak;
    } catch (error) {
      console.log('Error marking as prayed:', error);
      return null;
    }
  };

  const unmarkAsPrayed = async (prayerName) => {
    try {
      const targetDay = prayerTimes?.dateKey || locationDateKey;
      await storageBackend.savePrayerStatus(prayerName, false, targetDay);
      const result = await storageBackend.undoStreak(prayerName, targetDay);

      // Re-arm whatever is still in the future for this prayer (the scheduler
      // skips already-passed times, so remaining reminders come back)
      const prayerTime = prayerTimes?.[prayerName];
      if (prayerTime) {
        await schedulePrayerNotifications(prayerName, prayerTime, reminderMinutes, { recurring: recurringReminders, day: targetDay });
      }

      // Update daily streak (count + best)
      const newDailyStreak = await storageBackend.getDailyStreak();
      setDailyStreak(newDailyStreak);
      const best = await storageBackend.getBestDailyStreak();
      setBestDailyStreak(best);
      
      setPrayedStatus(prev => {
        const updated = { ...prev };
        delete updated[prayerName];
        return updated;
      });
      setStreaks(prev => ({ ...prev, [prayerName]: result }));
      
      return result;
    } catch (error) {
      console.log('Error unmarking as prayed:', error);
      return null;
    }
  };

  const togglePrayed = async (prayerName, currentlyPrayed) => {
    if (currentlyPrayed) {
      return await unmarkAsPrayed(prayerName);
    } else {
      if (prayerName === 'sunrise') return null;
      if (!isPrayerTimePassed(prayerName)) return null;
      return await markAsPrayed(prayerName);
    }
  };

  const isPrayed = (prayerName) => {
    return prayedStatus[prayerName]?.completed || false;
  };

  const getPrayerStreak = (prayerName) => {
    return streaks[prayerName] || { current: 0, best: 0, lastDate: null };
  };

  return (
    <PrayerContext.Provider value={{
      prayerTimes,
      tomorrowTimes,
      nextPrayer,
      currentPrayer,
      prayedStatus,
      streaks,
      dailyStreak,
      bestDailyStreak,
      location,
      setLocation,
      madhab,
      setMadhab,
      locationDateKey,
      showCongratulations,
      markAsPrayed,
      unmarkAsPrayed,
      togglePrayed,
      isPrayed,
      getPrayerStreak,
      isPrayerTimePassed,
      loadTodayData,
      hideCongratulations,
    }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);
