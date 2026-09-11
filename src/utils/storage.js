// src/utils/storage.js - React Native Unified Backend Storage Service
// All data stored locally on device using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

function shiftDateKey(dateKey, days) {
    const date = new Date(dateKey || new Date().toDateString());
    if (isNaN(date.getTime())) return new Date().toDateString();
    date.setDate(date.getDate() + days);
    return date.toDateString();
}

class StorageBackend {
    constructor() {
        this.dbName = 'salati_db';
        this.stores = {
            PRAYED: 'prayed',
            STREAKS: 'streaks',
            DAILY_STREAK: 'daily_streak',
            SETTINGS: 'settings',
            HISTORY: 'history'
        };
        this.memoryCache = {};
        this.initialized = false;
        this.init();
    }

    async init() {
        if (this.initialized) return;
        try {
            const keys = await AsyncStorage.getAllKeys();
            const salatiKeys = keys.filter(key => key.startsWith(this.dbName));
            const stores = await AsyncStorage.multiGet(salatiKeys);
            stores.forEach(([key, value]) => {
                try {
                    this.memoryCache[key] = JSON.parse(value);
                } catch {
                    this.memoryCache[key] = value;
                }
            });
            this.initialized = true;
            console.log('Storage Backend initialized');
        } catch (error) {
            console.error('Storage init error:', error);
            this.initialized = true;
        }
    }

    async get(storeName, key) {
        const fullKey = `${this.dbName}_${storeName}_${key}`;
        try {
            if (this.memoryCache[fullKey] !== undefined) {
                return this.memoryCache[fullKey];
            }
            const data = await AsyncStorage.getItem(fullKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.memoryCache[fullKey] = parsed;
                return parsed;
            }
            return null;
        } catch (error) {
            console.error(`Get error [${storeName}/${key}]:`, error);
            return null;
        }
    }

    async set(storeName, key, value) {
        const fullKey = `${this.dbName}_${storeName}_${key}`;
        try {
            const serialized = JSON.stringify(value);
            await AsyncStorage.setItem(fullKey, serialized);
            this.memoryCache[fullKey] = value;
            return true;
        } catch (error) {
            console.error(`Set error [${storeName}/${key}]:`, error);
            return false;
        }
    }

    async delete(storeName, key) {
        const fullKey = `${this.dbName}_${storeName}_${key}`;
        try {
            await AsyncStorage.removeItem(fullKey);
            delete this.memoryCache[fullKey];
            return true;
        } catch (error) {
            console.error(`Delete error [${storeName}/${key}]:`, error);
            return false;
        }
    }

    async getAll(storeName) {
        const prefix = `${this.dbName}_${storeName}_`;
        const results = {};
        try {
            const keys = await AsyncStorage.getAllKeys();
            const storeKeys = keys.filter(key => key.startsWith(prefix));
            const stores = await AsyncStorage.multiGet(storeKeys);
            stores.forEach(([key, value]) => {
                const shortKey = key.replace(prefix, '');
                try {
                    results[shortKey] = JSON.parse(value);
                } catch {
                    results[shortKey] = value;
                }
            });
        } catch (error) {
            console.error(`GetAll error [${storeName}]:`, error);
        }
        return results;
    }

    async clearStore(storeName) {
        const prefix = `${this.dbName}_${storeName}_`;
        try {
            const keys = await AsyncStorage.getAllKeys();
            const storeKeys = keys.filter(key => key.startsWith(prefix));
            await AsyncStorage.multiRemove(storeKeys);
            storeKeys.forEach(key => delete this.memoryCache[key]);
            return true;
        } catch (error) {
            console.error(`ClearStore error [${storeName}]:`, error);
            return false;
        }
    }

    async clearAll() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const salatiKeys = keys.filter(key => key.startsWith(this.dbName));
            await AsyncStorage.multiRemove(salatiKeys);
            this.memoryCache = {};
            return true;
        } catch (error) {
            console.error('ClearAll error:', error);
            return false;
        }
    }

    async savePrayerStatus(prayerName, status, dateKey) {
        const today = dateKey || new Date().toDateString();
        let prayedData = await this.get(this.stores.PRAYED, today) || {};
        prayedData[prayerName] = {
            completed: status,
            timestamp: status ? new Date().toISOString() : null
        };
        return this.set(this.stores.PRAYED, today, prayedData);
    }

    async getPrayerStatus(date = new Date().toDateString()) {
        return await this.get(this.stores.PRAYED, date) || {};
    }

    async updateStreak(prayerName, dateKey) {
        const today = dateKey || new Date().toDateString();
        const yesterday = shiftDateKey(today, -1);
        
        let streak = await this.get(this.stores.STREAKS, prayerName) || {
            current: 0,
            best: 0,
            lastDate: null,
            history: []
        };

        if (streak.lastDate === today) return streak;

        if (streak.lastDate === yesterday) {
            streak.current += 1;
        } else {
            streak.current = 1;
        }

        streak.best = Math.max(streak.best, streak.current);
        streak.lastDate = today;
        streak.history = streak.history || [];
        streak.history.push({ date: today, count: streak.current });
        
        if (streak.history.length > 365) {
            streak.history = streak.history.slice(-365);
        }

        await this.set(this.stores.STREAKS, prayerName, streak);
        await this.checkDailyStreak(today);
        return streak;
    }

    async undoStreak(prayerName, dateKey) {
        const today = dateKey || new Date().toDateString();
        const yesterday = shiftDateKey(today, -1);
        
        let streak = await this.get(this.stores.STREAKS, prayerName) || {
            current: 0,
            best: 0,
            lastDate: null
        };

        if (streak.lastDate === today) {
            streak.current = Math.max(0, streak.current - 1);
            streak.lastDate = yesterday;
        }

        await this.set(this.stores.STREAKS, prayerName, streak);
        await this.undoDailyStreak(today);
        return streak;
    }

    async undoDailyStreak(dateKey) {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const today = dateKey || new Date().toDateString();
        const yesterday = shiftDateKey(today, -1);
        
        // Check if all prayers are still completed
        let allPrayed = true;
        for (const prayer of prayers) {
            const data = await this.get(this.stores.PRAYED, today);
            if (!data[prayer] || !data[prayer].completed) {
                allPrayed = false;
                break;
            }
        }
        
        // If not all prayed, undo the daily streak
        if (!allPrayed) {
            let daily = await this.get(this.stores.DAILY_STREAK, 'current') || { count: 0, lastDate: null };
            
            if (daily.lastDate === today) {
                // Decrease daily streak
                daily.count = Math.max(0, (daily.count || 0) - 1);
                // Move lastDate to yesterday so re-marking can count again
                daily.lastDate = yesterday;
                await this.set(this.stores.DAILY_STREAK, 'current', daily);
            }
        }
        
        return await this.getDailyStreak();
    }

    async getStreak(prayerName) {
        return await this.get(this.stores.STREAKS, prayerName) || {
            current: 0,
            best: 0,
            lastDate: null
        };
    }

    async getAllStreaks() {
        return await this.getAll(this.stores.STREAKS);
    }

    async updateDailyStreak(dateKey) {
        const today = dateKey || new Date().toDateString();
        const yesterday = shiftDateKey(today, -1);
        
        let daily = await this.get(this.stores.DAILY_STREAK, 'current') || {
            count: 0,
            best: 0,
            lastDate: null,
            history: []
        };

        if (daily.lastDate === today) return daily.count;

        if (daily.lastDate === yesterday || !daily.lastDate) {
            daily.count = (daily.count || 0) + 1;
        } else {
            daily.count = 1;
        }

        daily.best = Math.max(daily.best || 0, daily.count);
        daily.lastDate = today;
        daily.history = daily.history || [];
        daily.history.push({ date: today, count: daily.count });
        
        if (daily.history.length > 365) {
            daily.history = daily.history.slice(-365);
        }

        await this.set(this.stores.DAILY_STREAK, 'current', daily);
        return daily.count;
    }

    async getDailyStreak() {
        const data = await this.get(this.stores.DAILY_STREAK, 'current');
        return data ? data.count : 0;
    }

    async getBestDailyStreak() {
        const data = await this.get(this.stores.DAILY_STREAK, 'current');
        return data ? (data.best || data.count || 0) : 0;
    }

    async getDailyStreakData() {
        const data = await this.get(this.stores.DAILY_STREAK, 'current');
        if (!data) return { count: 0, best: 0, lastDate: null };
        return { count: data.count || 0, best: data.best || data.count || 0, lastDate: data.lastDate || null };
    }

    async checkDailyStreak(dateKey) {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const today = dateKey || new Date().toDateString();
        const prayedData = await this.get(this.stores.PRAYED, today) || {};
        
        const allPrayed = prayers.every(p => prayedData[p] && prayedData[p].completed);
        
        if (allPrayed) {
            const lastCompletion = await this.get(this.stores.DAILY_STREAK, 'current');
            if (!lastCompletion || lastCompletion.lastDate !== today) {
                await this.updateDailyStreak();
                return true;
            }
        }
        return false;
    }

    async saveSettings(settings) {
        return this.set(this.stores.SETTINGS, 'app_settings', settings);
    }

    async getSettings() {
        const stored = await this.get(this.stores.SETTINGS, 'app_settings');
        if (stored) return stored;
        // No stored settings: location stays null so startup can tell
        // "never chosen" apart from a real saved fix (and run GPS).
        // Every consumer must fall back to Cairo when location is null.
        return {
            reminderMinutes: 10,
            notificationsEnabled: true,
            calculationMethod: 'Egyptian',
            madhab: 'Shafi',
            location: null,
            theme: 'dark',
            language: 'ar'
        };
    }

    async exportData() {
        return {
            version: 1,
            exportDate: new Date().toISOString(),
            prayed: await this.getAll(this.stores.PRAYED),
            streaks: await this.getAll(this.stores.STREAKS),
            dailyStreak: await this.get(this.stores.DAILY_STREAK, 'current'),
            settings: await this.getSettings(),
            history: await this.getAll(this.stores.HISTORY)
        };
    }

    async importData(data) {
        try {
            if (!data.version || !data.prayed) {
                throw new Error('Invalid data format');
            }

            await this.clearAll();

            for (const [date, prayers] of Object.entries(data.prayed)) {
                await this.set(this.stores.PRAYED, date, prayers);
            }

            if (data.streaks) {
                for (const [prayer, streak] of Object.entries(data.streaks)) {
                    await this.set(this.stores.STREAKS, prayer, streak);
                }
            }

            if (data.dailyStreak) {
                await this.set(this.stores.DAILY_STREAK, 'current', data.dailyStreak);
            }

            if (data.settings) {
                await this.saveSettings(data.settings);
            }

            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    async getStatistics() {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const stats = {
            totalPrayers: 0,
            completedPrayers: 0,
            completionRate: 0,
            currentStreaks: {},
            bestStreaks: {},
            dailyStreak: await this.getDailyStreak(),
        };

        for (const prayer of prayers) {
            const streak = await this.getStreak(prayer);
            stats.currentStreaks[prayer] = streak.current;
            stats.bestStreaks[prayer] = streak.best;
        }

        let totalSlots = 0;
        let completedSlots = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            const prayed = await this.getPrayerStatus(dateStr);
            
            prayers.forEach(prayer => {
                totalSlots++;
                if (prayed[prayer] && prayed[prayer].completed) {
                    completedSlots++;
                    stats.completedPrayers++;
                }
            });
        }

        stats.totalPrayers = totalSlots;
        stats.completionRate = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

        return stats;
    }

    async getStorageUsage() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const salatiKeys = keys.filter(k => k.startsWith(this.dbName));
            const stores = await AsyncStorage.multiGet(salatiKeys);
            let totalSize = 0;
            stores.forEach(([key, value]) => {
                totalSize += (key.length + (value?.length || 0)) * 2;
            });
            return {
                used: totalSize,
                usedFormatted: this.formatBytes(totalSize),
                itemCount: salatiKeys.length
            };
        } catch {
            return { used: 0, usedFormatted: '0 Bytes', itemCount: 0 };
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const storageBackend = new StorageBackend();

export const Storage = {
    get(key) { return storageBackend.get('legacy', key); },
    set(key, value) { return storageBackend.set('legacy', key, value); },
    getTodayKey() { return new Date().toDateString(); },
    getYesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toDateString(); }
};

export default StorageBackend;
