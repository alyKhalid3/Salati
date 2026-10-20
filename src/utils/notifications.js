// src/utils/notifications.js - unified for native (expo) and web (Notification API)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PRAYER_NAMES } from './prayerTimes';

const webTimers = {};

// Serialize all schedule/cancel operations. Concurrent scheduling passes
// (settings loading, effect refires) used to interleave cancel→schedule steps
// and orphan live notifications, which made them fire multiple times.
let opQueue = Promise.resolve();
const enqueue = (fn) => {
  const run = opQueue.then(fn, fn);
  opQueue = run.then(() => {}, () => {});
  return run;
};

// Ensure Android channel exists (required for Android 8+ to show)
let channelReady = false;
async function ensureChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'أوقات الصلاة',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [200, 100, 200],
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
    channelReady = true;
  } catch {}
}

// The toast wears the active world's card law exactly — same recipe as the
// home banner card: radius 16 (RADII.lg), surface fill, gold hairline, the
// theme's `raise` shadow, Cairo type. Each fire re-reads the page's own
// background so the toast follows the sun (ivory parchment vs night green).
function toastCard() {
  // Prefer the truth from the running app (PrayerContext publishes it).
  let dark = typeof window !== 'undefined' && window.__salatiTheme ? window.__salatiTheme.dark : undefined;
  if (dark === undefined) {
    // Guest path: fall back to sampling the page canvas. Skip transparent
    // layers explicitly — rgba(0,0,0,0) is not a dark world.
    dark = true;
    try {
      const probes = [document.querySelector('#root > div'), document.getElementById('root'), document.body];
      for (const el of probes) {
        if (!el) continue;
        const rgba = getComputedStyle(el).backgroundColor || '';
        const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) continue;
        if (m[4] !== undefined && Number(m[4]) < 0.1) continue; // transparent layer — keep looking
        const lum = 0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3]);
        dark = lum < 120;
        break;
      }
    } catch {}
  }
  return dark
    ? { bg: '#122018', border: 'rgba(217, 184, 105, 0.16)', title: '#eadfc6', body: '#a8b5a8', shadow: '0px 10px 26px 0px rgba(0, 0, 0, 0.45), 0px 3px 8px 0px rgba(0, 0, 0, 0.3)' }
    : { bg: '#fbf7ed', border: 'rgba(201, 162, 83, 0.18)', title: '#22312b', body: '#5b6a61', shadow: '0px 10px 24px 0px rgba(26, 46, 38, 0.10), 0px 3px 8px 0px rgba(26, 46, 38, 0.07)' };
}

function showWebNotification(title, body, tag) {
  const msg = body;
  // Try system notification if permission granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => {
          try { reg.showNotification(title, { body: msg, tag, vibrate: [200,100,200] }); } catch { new window.Notification(title, { body: msg, tag }); }
        }).catch(() => { try { new window.Notification(title, { body: msg, tag }); } catch {} });
      } else {
        new window.Notification(title, { body: msg, tag });
      }
      return;
    } catch {}
  }
  // Fallback: in-app toast + vibrate
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200,100,200]); } catch {}
  if (typeof document !== 'undefined') {
    const T = toastCard();
    let el = document.getElementById('inAppToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'inAppToast';
      document.body.appendChild(el);
    }
    el.dir = 'rtl';
    el.style.cssText = [
      'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
      `background:${T.bg}`, `border:1px solid ${T.border}`, 'border-radius:16px',
      'padding:12px 16px', 'z-index:300', 'max-width:min(90%, 420px)', 'text-align:center',
      `box-shadow:${T.shadow}`, 'font-family:Cairo,sans-serif', 'overflow:hidden',
    ].join(';');
    el.textContent = '';
    const t = document.createElement('div');
    t.style.cssText = `font-size:13px;font-weight:700;color:${T.title};direction:rtl;`;
    t.textContent = title;
    const b = document.createElement('div');
    b.style.cssText = `font-size:12.5px;color:${T.body};direction:rtl;`;
    b.textContent = msg;
    el.appendChild(t);
    el.appendChild(b);
    el.style.display = 'block';
    el.style.opacity = '1';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.opacity='0'; setTimeout(()=>{ el.style.display='none'; },300); }, 6000);
  }
}

// Cancel every scheduled native notification for a prayer, optionally scoped
// to one day. Notifications persist across app restarts, so cancelling only
// in-memory tracked ids always left stale copies behind (duplicates).
async function cancelScheduledForPrayer(prayerId, dayKey) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      const data = n.content && n.content.data;
      if (!data || data.prayer !== prayerId) continue;
      if (dayKey && data.day !== dayKey) continue;
      try { await Notifications.cancelScheduledNotificationAsync(n.identifier); } catch {}
    }
  } catch (e) {
    console.log('Error listing scheduled notifications:', e);
  }
}

// prayerId: stable english id ('fajr'...); notifications are tagged with it in
// content.data.prayer plus the day they belong to, so cancellation is
// content-based and survives restarts.
export const schedulePrayerNotifications = (prayerId, prayerTime, reminderMinutes, options = {}) => enqueue(async () => {
  const { recurring = true, day } = options;
  const dayKey = day || prayerTime.toDateString();
  const prayerName = PRAYER_NAMES[prayerId] || prayerId;
  const now = new Date();
  // Web: use setTimeout + Notification API (works on http://localhost, fallback to in-app on insecure http://192.168...)
  if (Platform.OS === 'web') {
    for (const key of Object.keys(webTimers)) {
      if (key.startsWith(`${dayKey}_${prayerId}_`)) { clearTimeout(webTimers[key]); delete webTimers[key]; }
    }
    const reminderTime = new Date(prayerTime.getTime() - reminderMinutes * 60 * 1000);
    if (reminderTime > now) {
      webTimers[`${dayKey}_${prayerId}_before`] = setTimeout(() => showWebNotification('صلاتي - Salati', `صلاة ${prayerName} بعد ${reminderMinutes} دقائق`, `prayer-${prayerId}-${dayKey}-reminder`), reminderTime - now);
    }
    if (prayerTime > now) {
      webTimers[`${dayKey}_${prayerId}_ontime`] = setTimeout(() => showWebNotification('صلاتي - Salati', `حان وقت صلاة ${prayerName}`, `prayer-${prayerId}-${dayKey}`), prayerTime - now);
    }
    if (recurring) {
      // Steady 10-minute cadence after prayer time, up to 1 hour (6 reminders).
      // Marking the prayer prayed cancels the remaining ones for that day.
      for (const interval of [10, 20, 30, 40, 50, 60]) {
        const t = new Date(prayerTime.getTime() + interval * 60000);
        if (t > now) {
          webTimers[`${dayKey}_${prayerId}_${interval}`] = setTimeout(() => showWebNotification('صلاتي - Salati', `ما زالت صلاة ${prayerName} بانتظارك`, `prayer-${prayerId}-${dayKey}-${interval}`), t - now);
        }
      }
    }
    return;
  }
  await ensureChannel();
  await cancelScheduledForPrayer(prayerId, dayKey);
  const reminderTime = new Date(prayerTime.getTime() - reminderMinutes * 60 * 1000);
  if (reminderTime > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `صلاة ${prayerName} بعد ${reminderMinutes} دقائق`,
        body: 'قم واستعد للصلاة',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'before', prayer: prayerId, day: dayKey },
      },
      trigger: { type: 'date', date: reminderTime, channelId: 'prayer-times' },
    });
  }
  if (prayerTime > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `حان وقت صلاة ${prayerName}`,
        body: 'حي على الصلاة',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'atTime', prayer: prayerId, day: dayKey },
      },
      trigger: { type: 'date', date: prayerTime, channelId: 'prayer-times' },
    });
  }
  if (recurring) {
    // Steady 10-minute cadence after prayer time, up to 1 hour (6 reminders).
    // Marking the prayer prayed cancels the remaining ones for that day.
    for (const interval of [10, 20, 30, 40, 50, 60]) {
      const triggerTime = new Date(prayerTime.getTime() + interval * 60 * 1000);
      if (triggerTime > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `تذكير: صلاة ${prayerName}`,
            body: `ما زالت صلاة ${prayerName} بانتظارك`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: 'reminder', prayer: prayerId, day: dayKey, interval },
          },
          trigger: { type: 'date', date: triggerTime, channelId: 'prayer-times' },
        });
      }
    }
  }
});

// dayKey scopes the cancel to a single day's set (e.g. marking today's fajr
// prayed must keep tomorrow's fajr reminders). Omit it to clear all days.
export const cancelPrayerNotifications = (prayerId, dayKey) => enqueue(async () => {
  const shortKey = `_${prayerId}_`;
  for (const key of Object.keys(webTimers)) {
    if (dayKey ? key.startsWith(`${dayKey}_${prayerId}_`) : key.includes(shortKey)) { clearTimeout(webTimers[key]); delete webTimers[key]; }
  }
  if (Platform.OS === 'web') return;
  await cancelScheduledForPrayer(prayerId, dayKey);
});

export const cancelAllNotifications = () => enqueue(async () => {
  for (const key of Object.keys(webTimers)) { clearTimeout(webTimers[key]); delete webTimers[key]; }
  if (Platform.OS === 'web') return;
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) { console.log('Error cancelling notifications:', e); }
});

export const getScheduledNotifications = async () => {
  if (Platform.OS === 'web') return Object.keys(webTimers);
  return await Notifications.getAllScheduledNotificationsAsync();
};

// Test helper for mobile web: call from console - window.testMobileNotification()
if (typeof window !== 'undefined') {
  window.testMobileNotification = () => {
    showWebNotification('صلاتي - Salati', '🕌 اختبار الإشعارات - تعمل بنجاح!', 'test');
    setTimeout(() => showWebNotification('صلاتي - Salati', '⏰ تنبيه: حان وقت صلاة الفجر بعد 10 دقائق', 'test2'), 2000);
  };
}
