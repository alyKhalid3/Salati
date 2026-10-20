// src/context/PrayerContext.js
import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  calculatePrayerTimes,
  calculateTomorrowPrayerTimes,
  getNextPrayer,
  getCurrentPrayer,
  getDayPhase,
  getLocationDateKey,
  normalizeMadhab,
} from '../utils/prayerTimes';
import { storageBackend } from '../utils/storage';
import { THEMES, ATMOSPHERE } from '../utils/theme';
import { cancelPrayerNotifications, schedulePrayerNotifications } from '../utils/notifications';
import { useNotification } from './NotificationContext';

const DAILY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Local day-key shift (mirrors storage.js) so streak math stays synchronous.
const shiftKey = (dateKey, days) => {
  const d = new Date(dateKey);
  if (isNaN(d.getTime())) return dateKey;
  d.setDate(d.getDate() + days);
  return d.toDateString();
};

const PrayerContext = createContext();

// Shared stable fallback so memoized rows don't re-render on new literals.
const EMPTY_STREAK = { current: 0, best: 0, lastDate: null };

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
  const [dailyLastDate, setDailyLastDate] = useState(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [location, setLocationState] = useState(initialLocation || null);
  const [madhab, setMadhabState] = useState('Shafi');
  const [tickNow, setTickNow] = useState(() => new Date());
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
      setTickNow(now);
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
    const [prayed, allStreaks, ds, best, dailyData] = await Promise.all([
      storageBackend.getPrayerStatus(targetDay),
      storageBackend.getAllStreaks(),
      storageBackend.getDailyStreak(),
      storageBackend.getBestDailyStreak(),
      storageBackend.getDailyStreakData(),
    ]);
    setPrayedStatus(prayed);
    setStreaks(allStreaks);
    setDailyStreak(ds);
    setBestDailyStreak(best);
    setDailyLastDate(dailyData.lastDate || null);
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
    const targetDay = prayerTimes?.dateKey || locationDateKey;
    // Optimistic: the checkmark appears instantly; storage + streaks follow.
    const optimistic = { ...prayedStatus, [prayerName]: { completed: true, timestamp: new Date().toISOString() } };
    setPrayedStatus(optimistic);
    // Congrats pops instantly on the last prayer; storage + counts catch up below.
    const allPrayed = DAILY_PRAYERS.every(p => optimistic[p]?.completed);
    if (allPrayed) setShowCongratulations(true);
    // Optimistic streaks: same rule storage uses, painted now, reconciled after.
    const prevStreaks = streaks;
    const prevDaily = dailyStreak;
    const prevBest = bestDailyStreak;
    const prevDailyDate = dailyLastDate;
    const yesterday = shiftKey(targetDay, -1);
    const cur = streaks[prayerName] || EMPTY_STREAK;
    if (cur.lastDate !== targetDay) {
      const next = cur.lastDate === yesterday ? cur.current + 1 : 1;
      setStreaks(prev => ({ ...prev, [prayerName]: { ...cur, current: next, best: Math.max(cur.best, next), lastDate: targetDay } }));
    }
    if (allPrayed && dailyLastDate !== targetDay) {
      const nextDaily = (!dailyLastDate || dailyLastDate === yesterday) ? dailyStreak + 1 : 1;
      setDailyStreak(nextDaily);
      setBestDailyStreak(Math.max(bestDailyStreak, nextDaily));
      setDailyLastDate(targetDay);
    }
    try {
      // Parallelize independent storage writes + fire-and-forget notifications
      // so nothing blocks the UI thread
      const [newStreak] = await Promise.all([
        storageBackend.savePrayerStatus(prayerName, true, targetDay)
          .then(() => storageBackend.updateStreak(prayerName, targetDay)),
      ]);
      // Don't await — let it run in background after UI updates
      cancelPrayerNotifications(prayerName, targetDay).catch(() => {});

      setStreaks(prev => ({ ...prev, [prayerName]: newStreak }));

      if (allPrayed) {
        const [ds, best, dailyData] = await Promise.all([
          storageBackend.updateDailyStreak(targetDay),
          storageBackend.getBestDailyStreak(),
          storageBackend.getDailyStreakData(),
        ]);
        setDailyStreak(ds);
        setBestDailyStreak(best);
        setDailyLastDate(dailyData.lastDate || targetDay);
      }

      return newStreak;
    } catch (error) {
      console.log('Error marking as prayed:', error);
      // Roll back the optimistic mark so the UI never lies
      setPrayedStatus(prev => {
        const updated = { ...prev };
        delete updated[prayerName];
        return updated;
      });
      setStreaks(prevStreaks);
      setDailyStreak(prevDaily);
      setBestDailyStreak(prevBest);
      setDailyLastDate(prevDailyDate);
      return null;
    }
  };

  const unmarkAsPrayed = async (prayerName) => {
    const targetDay = prayerTimes?.dateKey || locationDateKey;
    // Optimistic: uncheck instantly, persist in background.
    const prevEntry = prayedStatus[prayerName];
    const prevStreaks = streaks;
    const prevDaily = dailyStreak;
    const prevBest = bestDailyStreak;
    const prevDailyDate = dailyLastDate;
    const yesterday = shiftKey(targetDay, -1);
    setPrayedStatus(prev => {
      const updated = { ...prev };
      delete updated[prayerName];
      return updated;
    });
    // Optimistic undo: mirror storage.undoStreak / undoDailyStreak instantly.
    const curUndo = streaks[prayerName];
    if (curUndo && curUndo.lastDate === targetDay) {
      setStreaks(prev => ({ ...prev, [prayerName]: { ...curUndo, current: Math.max(0, curUndo.current - 1), lastDate: yesterday } }));
    }
    if (dailyLastDate === targetDay) {
      setDailyStreak(Math.max(0, dailyStreak - 1));
      setDailyLastDate(yesterday);
    }
    try {
      await storageBackend.savePrayerStatus(prayerName, false, targetDay);
      const result = await storageBackend.undoStreak(prayerName, targetDay);

      // Re-arm whatever is still in the future for this prayer (the scheduler
      // skips already-passed times, so remaining reminders come back)
      const prayerTime = prayerTimes?.[prayerName];
      if (prayerTime) {
        await schedulePrayerNotifications(prayerName, prayerTime, reminderMinutes, { recurring: recurringReminders, day: targetDay });
      }

      // Update daily streak (count + best)
      const dailyData = await storageBackend.getDailyStreakData();
      setDailyStreak(dailyData.count);
      setBestDailyStreak(dailyData.best);
      setDailyLastDate(dailyData.lastDate || null);

      setStreaks(prev => ({ ...prev, [prayerName]: result }));

      return result;
    } catch (error) {
      console.log('Error unmarking as prayed:', error);
      // Roll back so the UI never lies
      if (prevEntry) setPrayedStatus(prev => ({ ...prev, [prayerName]: prevEntry }));
      setStreaks(prevStreaks);
      setDailyStreak(prevDaily);
      setBestDailyStreak(prevBest);
      setDailyLastDate(prevDailyDate);
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
    return streaks[prayerName] || EMPTY_STREAK;
  };

  // Daylight theme follows the sun: bright while the sun is up at the
  // selected location, dark otherwise. Re-evaluated on the 15s tick.
  let isDaytime = true;
  try {
    const sr = prayerTimes && prayerTimes.sunrise;
    const mg = prayerTimes && prayerTimes.maghrib;
    if (sr instanceof Date && mg instanceof Date && !isNaN(sr) && !isNaN(mg)) {
      isDaytime = tickNow >= sr && tickNow <= mg;
    }
  } catch {}
  // No toggle: the theme follows the sun at the selected location —
  // bright ivory while the sun is up, dark after maghrib.
  const effectiveTheme = isDaytime ? 'light' : 'dark';
  const C = THEMES[effectiveTheme];
  // Living atmosphere for daylight mode (tinted hero glows + phase chip).
  const phase = getDayPhase(prayerTimes, tickNow);
  const atmo = ATMOSPHERE[phase.key] || ATMOSPHERE.night;

  // Memoized value: without this, every per-second countdown tick creates a
  // new object and re-renders every consumer even when nothing changed.
  const value = useMemo(() => ({
      prayerTimes,
      tomorrowTimes,
      nextPrayer,
      currentPrayer,
      prayedStatus,
      streaks,
      dailyStreak,
      bestDailyStreak,
      dailyLastDate,
      location,
      setLocation,
      madhab,
      setMadhab,
      isDaytime,
      effectiveTheme,
      C,
      phase,
      atmo,
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
  }), [prayerTimes, tomorrowTimes, nextPrayer, currentPrayer, prayedStatus, streaks, dailyStreak, bestDailyStreak, dailyLastDate, location, setLocation, madhab, setMadhab, isDaytime, effectiveTheme, C, phase, atmo, locationDateKey, showCongratulations, markAsPrayed, unmarkAsPrayed, togglePrayed, isPrayed, getPrayerStreak, isPrayerTimePassed, loadTodayData, hideCongratulations, reminderMinutes, recurringReminders, tickNow]);

  return (
    <PrayerContext.Provider value={value}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);
