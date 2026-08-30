// src/context/PrayerContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculatePrayerTimes, getNextPrayer, getCurrentPrayer } from '../utils/prayerTimes';
import { storageBackend } from '../utils/storage';

const DAILY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PrayerContext = createContext();

export const PrayerProvider = ({ children, location }) => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [prayedStatus, setPrayedStatus] = useState({});
  const [streaks, setStreaks] = useState({});
  const [dailyStreak, setDailyStreak] = useState(0);
  const [showCongratulations, setShowCongratulations] = useState(false);

  useEffect(() => {
    if (location) {
      const times = calculatePrayerTimes(location.latitude, location.longitude);
      setPrayerTimes(times);
      setNextPrayer(getNextPrayer(times));
      setCurrentPrayer(getCurrentPrayer(times));
      loadTodayData();
    }
  }, [location]);

  const loadTodayData = async () => {
    const prayed = await storageBackend.getPrayerStatus();
    setPrayedStatus(prayed);
    const allStreaks = await storageBackend.getAllStreaks();
    setStreaks(allStreaks);
    const ds = await storageBackend.getDailyStreak();
    setDailyStreak(ds);
  };

  const hideCongratulations = () => {
    setShowCongratulations(false);
  };

  const markAsPrayed = async (prayerName) => {
    try {
      await storageBackend.savePrayerStatus(prayerName, true);
      const newStreak = await storageBackend.updateStreak(prayerName);
      
      const newStatus = { ...prayedStatus, [prayerName]: { completed: true, timestamp: new Date().toISOString() } };
      setPrayedStatus(newStatus);
      setStreaks(prev => ({ ...prev, [prayerName]: newStreak }));
      
      const allPrayed = DAILY_PRAYERS.every(p => newStatus[p]?.completed);
      if (allPrayed) {
        const ds = await storageBackend.updateDailyStreak();
        setDailyStreak(ds);
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
      await storageBackend.savePrayerStatus(prayerName, false);
      const result = await storageBackend.undoStreak(prayerName);
      
      // Update daily streak
      const newDailyStreak = await storageBackend.getDailyStreak();
      setDailyStreak(newDailyStreak);
      
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
      nextPrayer,
      currentPrayer,
      prayedStatus,
      streaks,
      dailyStreak,
      showCongratulations,
      markAsPrayed,
      unmarkAsPrayed,
      togglePrayed,
      isPrayed,
      getPrayerStreak,
      loadTodayData,
      hideCongratulations,
    }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);
