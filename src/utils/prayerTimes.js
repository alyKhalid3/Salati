// src/utils/prayerTimes.js
// Pure JS implementation - works with Hermes (React Native JS engine)
// Matches web/app.js calculation exactly

const mod = (a, b) => ((a % b) + b) % b;

function gregorianToJulian(year, month, day) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunDeclination(jd) {
  const D = jd - 2451545.0;
  const g = mod(357.529 + 0.98560028 * D, 360);
  const q = mod(280.459 + 0.98564736 * D, 360);
  const L = mod(q + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180), 360);
  const e = 23.439 - 0.00000036 * D;
  return Math.asin(Math.sin(e * Math.PI / 180) * Math.sin(L * Math.PI / 180)) * 180 / Math.PI;
}

function equationOfTime(jd) {
  const D = jd - 2451545.0;
  const g = mod(357.529 + 0.98560028 * D, 360);
  const q = mod(280.459 + 0.98564736 * D, 360);
  const L = mod(q + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = Math.atan2(Math.cos(e * Math.PI / 180) * Math.sin(L * Math.PI / 180), Math.cos(L * Math.PI / 180)) * 180 / Math.PI / 15;
  return q / 15 - RA;
}

export const calculatePrayerTimes = (latitude, longitude) => {
  const now = new Date();
  const jd = gregorianToJulian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const noon = 12 - equationOfTime(jd) - longitude / 15;

  const fajrAngle = 19.5;
  const ishaAngle = 17.5;

  function computeTime(angle, isAfterNoon) {
    const decl = sunDeclination(jd);
    const V = (-Math.sin(angle * Math.PI / 180) - Math.sin(decl * Math.PI / 180) * Math.sin(latitude * Math.PI / 180)) / (Math.cos(decl * Math.PI / 180) * Math.cos(latitude * Math.PI / 180));
    if (V < -1 || V > 1) return null;
    const t = Math.acos(V) * 180 / Math.PI / 15;
    return isAfterNoon ? noon + t : noon - t;
  }

  const sunrise = computeTime(0.833, false);
  const sunset = computeTime(0.833, true);
  const fajr = computeTime(fajrAngle, false);
  const isha = computeTime(ishaAngle, true);
  const dhuhr = noon + 1/60;

  const decl = sunDeclination(jd);
  const asrAlt = Math.atan2(1, 1 + Math.tan(Math.abs(latitude - decl) * Math.PI / 180)) * 180 / Math.PI;
  const asrV = (Math.sin(asrAlt * Math.PI / 180) - Math.sin(decl * Math.PI / 180) * Math.sin(latitude * Math.PI / 180)) / (Math.cos(decl * Math.PI / 180) * Math.cos(latitude * Math.PI / 180));
  const asr = noon + Math.acos(Math.max(-1, Math.min(1, asrV))) * 180 / Math.PI / 15;
  const maghrib = sunset;

  const timezoneOffset = -now.getTimezoneOffset() / 60;
  function toLocalTime(decimalHours) {
    if (decimalHours === null || decimalHours === undefined) return null;
    let localHours = decimalHours + timezoneOffset;
    if (localHours >= 24) localHours -= 24;
    if (localHours < 0) localHours += 24;
    const h = Math.floor(localHours);
    const m = Math.floor((localHours - h) * 60);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  }

  return {
    fajr: toLocalTime(fajr),
    sunrise: toLocalTime(sunrise),
    dhuhr: toLocalTime(dhuhr),
    asr: toLocalTime(asr),
    maghrib: toLocalTime(maghrib),
    isha: toLocalTime(isha),
  };
};

export const getNextPrayer = (prayerTimes) => {
  const now = new Date();
  const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const prayer of prayers) {
    if (prayerTimes[prayer] && prayerTimes[prayer] > now) {
      return { name: prayer, time: prayerTimes[prayer] };
    }
  }
  const tomorrow = prayerTimes.fajr ? new Date(prayerTimes.fajr) : new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { name: 'fajr', time: tomorrow };
};

export const getCurrentPrayer = (prayerTimes) => {
  const now = new Date();
  const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (let i = prayers.length - 1; i >= 0; i--) {
    if (prayerTimes[prayers[i]] && prayerTimes[prayers[i]] <= now) return prayers[i];
  }
  return 'isha';
};

export const getTimeUntil = (targetTime) => {
  if (!targetTime) return 0;
  return targetTime.getTime() - new Date().getTime();
};

export const formatTime = (date) => {
  if (!date || isNaN(date.getTime())) return '--:--';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export const formatCountdown = (ms) => {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const PRAYER_NAMES = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const PRAYER_ICONS = {
  fajr: 'moon',
  sunrise: 'sunrise',
  dhuhr: 'sun',
  asr: 'cloud',
  maghrib: 'sunset',
  isha: 'moon',
};
