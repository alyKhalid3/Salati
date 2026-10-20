// src/utils/strings.js — single source of Arabic UI copy (EN-ready).
// PRODUCT.md constraint: no hardcoded UI strings in screens/components.
// Add an `en` object later and wire a locale switch; screens never inline copy.

export const S = {
  appName: 'صلاتي',
  nextPrayer: 'الصلاة القادمة',
  todayPrayers: 'مواقيت اليوم',
  changeLocation: (city) => `تغيير الموقع: ${city}`,
  settings: 'الإعدادات',
  settingsScreenTitle: 'الإعدادات',
  back: 'رجوع',

  // Home — hero
  remainingOnSunset: (t) => `متبقي على الغروب ${t}`,
  risingInAfter: (t) => `الشروق بعد ${t}`,
  nightNowSunriseAt: (t) => `ليلاً · الشروق ${t}`,
  madhab_shafi: 'شافعي',
  madhab_hanafi: 'حنفي',

  // Home — lists
  markPrayed: 'صليت',
  marked: 'تمت',
  streakBadge: (n) => `${n} يوم`,
  streakTitle: 'سِجِلُّك',
  streakTotal: 'المجموع',
  streakDaily: 'اليوم',
  streakBest: 'الأفضل',
  streakUnit: 'يوم',

  // Settings (home inline console)
  notificationsPrayer: 'تنبيهات الصلاة',
  reminderBefore: 'تنبيه قبل الصلاة',
  minutesLabel: 'دقائق',
  asrCalculation: 'حساب العصر',

  // Banner
  bannerEnable: 'فعّل التنبيهات لتذكيرك بالصلاة',
  bannerAction: 'تفعيل',

  // Footer
  footerLine: 'صلاتي — ليكن قلبك مع الله',

  // Loading
  loadingTimes: 'جاري تحميل مواقيت الصلاة...',

  // Wisdom card
  wisdomCaption: 'من القرآن الكريم',

  //Congratulations
  congratsTitle: 'الحمد لله!',
  congratsBody: (n) => `خمس صلوات اليوم... ${n} أيام متتالية`,
  congratsClose: 'تقفل',

  // Notifications toast (web fallback)
  toastGeneric: 'تنبيه',

  // Pages (bottom tab bar)
  tabHome: 'الرئيسية',
  tabTimes: 'المواقيت',
  tabProgress: 'التقدم',
  tabSettings: 'الإعدادات',
  progressPrayers: 'سلاسل الصلوات',
  fridayKhatam: 'جمعة مباركة',
};

// Arabic-Indic numerals for the identity-bearing digits (porcelain world).
// Latin digits stay only where tabular jiggle cannot be fixed by layout.
export const toArabicDigits = (value) =>
  String(value).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
