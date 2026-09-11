// src/utils/prayerTimes.js
// Global prayer-time calculation built on the Adhan runtime.
// All returned prayer values are absolute Date objects in UTC. Callers must
// display them with formatTime(date, timezone) so a selected city remains
// correct even when the device timezone is different.
import * as Adhan from 'adhan';

export const CALCULATION_METHODS = {
  Egyptian: 'Egyptian',
  MuslimWorldLeague: 'MuslimWorldLeague',
  UmmAlQura: 'UmmAlQura',
  NorthAmerica: 'NorthAmerica',
  Turkey: 'Turkey',
  Tehran: 'Tehran',
  Karachi: 'Karachi',
  Singapore: 'Singapore',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
};

export const MADHABS = {
  Shafi: 'Shafi',
  Hanafi: 'Hanafi',
};

const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const DAILY_PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const HIGH_LATITUDE_THRESHOLD = 48;
const POLAR_CIRCLE_THRESHOLD = 65;
const DEFAULT_LOCATION = {
  latitude: 30.0444,
  longitude: 31.2357,
  method: 'Egyptian',
  timezone: 'Africa/Cairo',
};

const COUNTRY_CALCULATION_METHODS = {
  EG: 'Egyptian',
  JO: 'Egyptian',
  LB: 'Egyptian',
  SD: 'Egyptian',
  SA: 'UmmAlQura',
  QA: 'Qatar',
  KW: 'Kuwait',
  US: 'NorthAmerica',
  CA: 'NorthAmerica',
  TR: 'Turkey',
  IR: 'Tehran',
  PK: 'Karachi',
  SG: 'Singapore',
  MY: 'Singapore',
};

const COUNTRY_NAME_METHODS = [
  [/saudi/, 'UmmAlQura'],
  [/egypt|مصر/, 'Egyptian'],
  [/jordan|أردن/, 'Egyptian'],
  [/lebanon|لبنان/, 'Egyptian'],
  [/sudan|سودان/, 'Egyptian'],
  [/qatar|قطر/, 'Qatar'],
  [/kuwait|كويت/, 'Kuwait'],
  [/united states|canada|أمريكا|كندا/, 'NorthAmerica'],
  [/turk|türk|تركيا/, 'Turkey'],
  [/iran|إيران/, 'Tehran'],
  [/pakistan|باكستان/, 'Karachi'],
  [/singapore|سنغافورة/, 'Singapore'],
  [/malaysia|ماليزيا/, 'Singapore'],
];

function toFiniteNumber(value) {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return typeof parsed === 'number' && isFinite(parsed) ? parsed : null;
}

function asValidDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!(date instanceof Date) || isNaN(date.getTime())) return new Date();
  return date;
}

function isValidDate(value) {
  return value instanceof Date && !isNaN(value.getTime());
}

export function normalizeMethod(method) {
  if (method && CALCULATION_METHODS[method]) return CALCULATION_METHODS[method];
  return CALCULATION_METHODS.Egyptian;
}

export function normalizeMadhab(madhab) {
  if (typeof madhab === 'string' && madhab.toLowerCase() === 'hanafi') return MADHABS.Hanafi;
  return MADHABS.Shafi;
}

export function normalizeCoordinates(latitude, longitude) {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude, fallback: true };
  }
  return { latitude: lat, longitude: lng, fallback: false };
}

export function isValidTimeZone(timezone) {
  if (typeof timezone !== 'string' || timezone.length === 0) return false;
  try {
    if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') return timezone === 'UTC';
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function getDeviceTimeZoneName() {
  try {
    const name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(name) ? name : 'UTC';
  } catch {
    return 'UTC';
  }
}

export function resolveLocationTimeZone(location, at) {
  const explicit = location && location.timezone;
  const useDevice = !location || location.useDeviceTimezone === true;
  const device = getDeviceTimeZoneName();

  if (location && location.useDeviceTimezone === true) {
    return device;
  }
  if (isValidTimeZone(explicit)) return explicit;
  if (useDevice && isValidTimeZone(device)) return device;
  return 'UTC';
}

function getCalendarPartsInTimeZone(instant, timezone) {
  const at = asValidDate(instant);
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (typeof formatter.formatToParts === 'function') {
      let year;
      let month;
      let day;
      formatter.formatToParts(at).forEach((part) => {
        if (part.type === 'year') year = parseInt(part.value, 10);
        if (part.type === 'month') month = parseInt(part.value, 10);
        if (part.type === 'day') day = parseInt(part.value, 10);
      });
      if (year && month && day) return { year, month, day };
    }
    const formatted = formatter.format(at);
    const match = formatted.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return { year: parseInt(match[1], 10), month: parseInt(match[2], 10), day: parseInt(match[3], 10) };
    }
  } catch {}
  return { year: at.getFullYear(), month: at.getMonth() + 1, day: at.getDate() };
}

export function getLocationCalendarDate(location, options = {}) {
  const at = asValidDate(options.at || options.date || new Date());
  const timezone = resolveLocationTimeZone(location, at);
  const parts = getCalendarPartsInTimeZone(at, timezone);
  const utcDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  utcDay.setUTCDate(utcDay.getUTCDate() + (Number(options.dayOffset) || 0));
  const year = utcDay.getUTCFullYear();
  const month = utcDay.getUTCMonth() + 1;
  const day = utcDay.getUTCDate();
  return {
    year,
    month,
    day,
    timezone,
    // Preserve compatibility with existing stored keys, which use toDateString().
    key: new Date(year, month - 1, day).toDateString(),
    iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

export function getLocationDateKey(location, at) {
  return getLocationCalendarDate(location, { at }).key;
}

export function getLocationYesterdayKey(location, at) {
  return getLocationCalendarDate(location, { at, dayOffset: -1 }).key;
}

function getCalculationDate(calendarDate) {
  // Adhan only reads the calendar year/month/day. Noon avoids DST edge cases.
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day, 12, 0, 0, 0);
}

function createParameters(method, madhab, latitude, polarResolution) {
  const params = Adhan.CalculationMethod[method]();
  params.madhab = madhab === MADHABS.Hanafi ? Adhan.Madhab.Hanafi : Adhan.Madhab.Shafi;
  params.highLatitudeRule = Math.abs(latitude) >= HIGH_LATITUDE_THRESHOLD
    ? Adhan.HighLatitudeRule.SeventhOfTheNight
    : Adhan.HighLatitudeRule.MiddleOfTheNight;
  params.polarCircleResolution = polarResolution;
  return params;
}

function validateTimes(times) {
  if (!times) return false;
  for (const prayer of PRAYER_ORDER) {
    if (!isValidDate(times[prayer])) return false;
  }
  for (let i = 1; i < PRAYER_ORDER.length; i += 1) {
    if (times[PRAYER_ORDER[i]].getTime() < times[PRAYER_ORDER[i - 1]].getTime()) return false;
  }
  return true;
}

function buildResult(calculation, calendarDate, method, madhab) {
  return {
    fajr: calculation.fajr,
    sunrise: calculation.sunrise,
    dhuhr: calculation.dhuhr,
    asr: calculation.asr,
    maghrib: calculation.maghrib,
    isha: calculation.isha,
    dateKey: calendarDate.key,
    dateISO: calendarDate.iso,
    timezone: calendarDate.timezone,
    method,
    madhab,
    source: 'adhan',
  };
}

function getISODateInTimeZone(instant, timezone) {
  const parts = getCalendarPartsInTimeZone(instant, timezone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function diffISODays(a, b) {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
}

export const calculatePrayerTimes = (latitude, longitude, method, timezone, date, madhab = 'Shafi', dayOffset = 0) => {
  const coordinates = normalizeCoordinates(latitude, longitude);
  const normalizedMethod = coordinates.fallback ? DEFAULT_LOCATION.method : normalizeMethod(method);
  const normalizedMadhab = normalizeMadhab(madhab);
  const location = {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    method: normalizedMethod,
    timezone: coordinates.fallback ? DEFAULT_LOCATION.timezone : timezone,
    useDeviceTimezone: coordinates.fallback ? false : undefined,
  };
  const adhanCoordinates = new Adhan.Coordinates(coordinates.latitude, coordinates.longitude);
  const resolutions = Math.abs(coordinates.latitude) >= POLAR_CIRCLE_THRESHOLD
    ? [Adhan.PolarCircleResolution.AqrabBalad, Adhan.PolarCircleResolution.AqrabYaum]
    : [Adhan.PolarCircleResolution.Unresolved];

  // Adhan anchors results to a UTC calendar date. Near the dateline's eastern
  // side (UTC+13/+14) the target day's dawn falls on the previous UTC date, so
  // verify Fajr lands on the requested target day and shift once if needed.
  let offset = Number(dayOffset) || 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const calendarDate = getLocationCalendarDate(location, { at: date, dayOffset: offset });
    const calculationDate = getCalculationDate(calendarDate);
    for (const resolution of resolutions) {
      const calculation = new Adhan.PrayerTimes(
        adhanCoordinates,
        calculationDate,
        createParameters(normalizedMethod, normalizedMadhab, coordinates.latitude, resolution)
      );
      if (!validateTimes(calculation)) continue;
      const result = buildResult(calculation, calendarDate, normalizedMethod, normalizedMadhab);
      const fajrDay = getISODateInTimeZone(result.fajr, calendarDate.timezone);
      if (fajrDay === calendarDate.iso || attempt > 0) return result;
      offset -= diffISODays(fajrDay, calendarDate.iso);
      break;
    }
    if (attempt > 0) {
      const calendarDate = getLocationCalendarDate(location, { at: date, dayOffset: offset });
      return {
        fajr: null,
        sunrise: null,
        dhuhr: null,
        asr: null,
        maghrib: null,
        isha: null,
        dateKey: calendarDate.key,
        dateISO: calendarDate.iso,
        timezone: calendarDate.timezone,
        method: normalizedMethod,
        madhab: normalizedMadhab,
        source: 'adhan-unresolved',
      };
    }
  }

  // Every supported coordinate should resolve above. Preserve the old null-safe
  // shape rather than throwing inside render/notification paths.
  const calendarDate = getLocationCalendarDate(location, { at: date, dayOffset: offset });
  return {
    fajr: null,
    sunrise: null,
    dhuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
    dateKey: calendarDate.key,
    dateISO: calendarDate.iso,
    timezone: calendarDate.timezone,
    method: normalizedMethod,
    madhab: normalizedMadhab,
    source: 'adhan-unresolved',
  };
};

export const calculateTomorrowPrayerTimes = (latitude, longitude, method, timezone, date, madhab = 'Shafi') => (
  calculatePrayerTimes(latitude, longitude, method, timezone, date, madhab, 1)
);

export function getMethodForCountry({ isoCountryCode, country } = {}) {
  if (typeof isoCountryCode === 'string' && COUNTRY_CALCULATION_METHODS[isoCountryCode.trim().toUpperCase()]) {
    return COUNTRY_CALCULATION_METHODS[isoCountryCode.trim().toUpperCase()];
  }
  if (typeof country === 'string') {
    const normalized = country.toLowerCase();
    for (const [pattern, calculationMethod] of COUNTRY_NAME_METHODS) {
      if (pattern.test(normalized)) return calculationMethod;
    }
  }
  return CALCULATION_METHODS.MuslimWorldLeague;
}

function getAddressName(address, fallback = 'موقعي الحالي') {
  if (!address) return fallback;
  return address.city || address.subregion || address.region || address.name || fallback;
}

export function resolveGpsLocation({ latitude, longitude, address, name } = {}) {
  const coordinates = normalizeCoordinates(latitude, longitude);
  const method = getMethodForCountry(address);
  const timezone = isValidTimeZone(address && address.timezone)
    ? address.timezone
    : getDeviceTimeZoneName();
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    name: name || getAddressName(address),
    method,
    timezone,
    useDeviceTimezone: !isValidTimeZone(address && address.timezone),
    source: 'gps',
  };
}

export const getNextPrayer = (prayerTimes, tomorrowTimes, at) => {
  const now = asValidDate(at || new Date());
  for (const prayer of PRAYER_ORDER) {
    const time = prayerTimes && prayerTimes[prayer];
    if (isValidDate(time) && time > now) {
      return { name: prayer, time };
    }
  }
  if (tomorrowTimes && isValidDate(tomorrowTimes.fajr)) {
    return { name: 'fajr', time: tomorrowTimes.fajr };
  }
  let base = prayerTimes && isValidDate(prayerTimes.fajr) ? new Date(prayerTimes.fajr.getTime()) : new Date(now.getTime());
  base.setDate(base.getDate() + 1);
  return { name: 'fajr', time: base };
};

export const getCurrentPrayer = (prayerTimes, at) => {
  const now = asValidDate(at || new Date());
  if (!prayerTimes) return 'isha';
  for (let i = PRAYER_ORDER.length - 1; i >= 0; i -= 1) {
    const prayer = PRAYER_ORDER[i];
    if (isValidDate(prayerTimes[prayer]) && prayerTimes[prayer] <= now) return prayer;
  }
  return 'isha';
};

export const getTimeUntil = (targetTime) => {
  if (!isValidDate(targetTime)) return 0;
  return targetTime.getTime() - new Date().getTime();
};

function getTargetClockParts(date, timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  let hour;
  let minute;
  if (typeof formatter.formatToParts === 'function') {
    formatter.formatToParts(date).forEach((part) => {
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    });
  } else {
    const match = formatter.format(date).match(/(\d{1,2}):(\d{2})/);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
    }
  }
  if (typeof hour !== 'number' || typeof minute !== 'number' || isNaN(hour) || isNaN(minute)) return null;
  return { hour: hour % 24, minute };
}

export const formatTime = (date, timezone) => {
  if (!isValidDate(date)) return '--:--';
  try {
    if (isValidTimeZone(timezone)) {
      const parts = getTargetClockParts(date, timezone);
      if (parts) {
        const ampm = parts.hour >= 12 ? 'م' : 'ص';
        const displayHours = parts.hour % 12 || 12;
        return `${displayHours}:${String(parts.minute).padStart(2, '0')} ${ampm}`;
      }
    }
  } catch {}
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export const formatCountdown = (ms) => {
  if (ms === null || ms === undefined || isNaN(ms) || ms <= 0) return '00:00:00';
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

export const DAILY_PRAYERS = DAILY_PRAYER_ORDER;
