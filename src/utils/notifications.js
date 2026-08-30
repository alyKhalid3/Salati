// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Store notification IDs so we can cancel them
const notificationIds = {};

export const schedulePrayerNotifications = async (prayerName, prayerTime, reminderMinutes) => {
  const now = new Date();
  const reminderTime = new Date(prayerTime.getTime() - reminderMinutes * 60 * 1000);
  
  // Clear any existing notifications for this prayer
  await cancelPrayerNotifications(prayerName);
  
  const ids = [];
  
  // Schedule "before" notification
  if (reminderTime > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ تنبيه: حان وقت صلاة ${prayerName} بعد ${reminderMinutes} دقائق`,
        body: 'لَا تُؤَخِّرْ صَلَاتَكَ، فَالشَّيْطَانُ يَرْقُبُكَ',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'before', prayer: prayerName },
      },
      trigger: {
        date: reminderTime,
      },
    });
    ids.push(id);
  }
  
  // Schedule "at time" notification
  if (prayerTime > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🕌 حان الآن وقت صلاة ${prayerName}`,
        body: 'قُمْ وَصَلِّ الْآنَ',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'atTime', prayer: prayerName },
      },
      trigger: {
        date: prayerTime,
      },
    });
    ids.push(id);
  }
  
  // Schedule recurring reminders (5, 10, 20, 30 min after prayer time)
  const intervals = [5, 10, 20, 30];
  for (const interval of intervals) {
    const triggerTime = new Date(prayerTime.getTime() + interval * 60 * 1000);
    if (triggerTime > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: interval <= 10 ? `🔔 تذكير: صلاة ${prayerName}` : `⚠️ لم تصلِّ بعد!`,
          body: interval <= 10 
            ? `مرت ${interval} دقائق على صلاة ${prayerName}. لم تصلِّ بعد؟`
            : `مضى ${interval} دقيقة على صلاة ${prayerName} ولم تسجلها. قُم وصلِّ الآن!`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'reminder', prayer: prayerName, interval },
        },
        trigger: {
          date: triggerTime,
        },
      });
      ids.push(id);
    }
  }
  
  notificationIds[prayerName] = ids;
  return ids;
};

// Cancel all notifications for a specific prayer (when user marks as completed)
export const cancelPrayerNotifications = async (prayerName) => {
  const ids = notificationIds[prayerName] || [];
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.log('Error cancelling notification:', error);
    }
  }
  notificationIds[prayerName] = [];
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const key of Object.keys(notificationIds)) {
    notificationIds[key] = [];
  }
};

// Get all scheduled notifications (for debugging)
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
