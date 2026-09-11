This project is صلاتي - Salati v1.0.0, an Arabic RTL Islamic prayer-times app built with Expo + React Native 0.81 + React 19 for Android / iOS / Web from one codebase.
1. What it does
- Calculates daily prayer times offline on-device, no API.
- Shows next prayer + live HH:MM:SS countdown + today's times.
- Lets you mark صليت per prayer, tracks per-prayer + daily streaks, shows congratulations modal when all 5 done.
- Sends local notifications: before-prayer reminder, on-time, + recurring 5,10,20,30 min if not marked prayed.
- Supports GPS + 38 preset cities with correct calculation method/timezone.
- Dark luxury UI: #0a0a0a/#141414/#d4956a, Amiri for headings, Cairo for body, animated entrance + breathe/pulse effects.
- Works on web as mobile-width 420px centered app.
2. Tech stack - package.json
expo ~54, expo-location, expo-notifications, expo-splash-screen, react-navigation/native-stack, async-storage, react-native-svg, safe-area-context, screens, gesture-handler, react-native-web. Entry: App.js ("main": "App.js").
3. Structure
App.js               # entry, providers, navigation, GPS, permissions, web RTL/fonts
src/screens/HomeScreen.js      # main UI: hero, countdown, list, settings, banner
src/screens/SettingsScreen.js  # full settings, test notification, exact-alarm, export/clear
src/context/PrayerContext.js   # prayer times state, prayed, streaks, location, day-rollover
src/context/NotificationContext.js # notification prefs + AsyncStorage persist + ready flag
src/utils/prayerTimes.js       # pure JS astronomy: sun declination, Eq. of Time
src/utils/notifications.js     # unified native+web scheduler with dedup queue
src/utils/storage.js           # AsyncStorage wrapper: prayed/streaks/settings
src/utils/cities.js            # 38 cities: Egypt/Egyptian, Saudi/UmmAlQura, Gulf/MWL
src/utils/messages.js          # Quran/hadith/motivational texts + before/after
src/components/                # PrayerRow, LocationPicker, WisdomCard, StreakSummary, CongratulationsModal
app.json / eas.json / babel.config.js / metro.config.js / webpack.config.js
android/ / assets/ / public/
4. How it works
App.js: Defaults location to Cairo, loads saved location, asks Location + Notifications permission deferred 500ms after paint, hides splash when ready. Wraps app in SafeAreaProvider > NotificationProvider > PrayerProvider > NavigationContainer(Home,Settings-lazy).
prayerTimes.js: gregorianToJulian() -> sunDeclination() + equationOfTime() -> noon = 12 - EoT - lng/15. Computes Fajr/Sunrise/Dhuhr/Asr(Shafi)/Maghrib/Isha with angles: Egyptian 19.5/17.5, MWL 18/17, UmmAlQura 18.5 + 90min Isha. Converts to local via timezone with Hermes-safe fallback. Provides getNextPrayer(), getCurrentPrayer(), formatTime() Arabic ص/م, formatCountdown().
PrayerContext.js: On location change -> recalculate(). Checks midnight rollover every 30s. togglePrayed() locks future prayers + sunrise (non-actionable), saves to storage, cancels today's reminders on pray, re-arms on un-pray, updates daily streak + showCongratulations.
storage.js (salati_db_*): Stores per-day prayed[date], streaks[prayer]={current,best,lastDate}, daily_streak={count,best}, settings={reminderMinutes, notificationsEnabled, location...}. Handles streak continuity yesterday->today, undo logic, export/import, 30-day stats.
notifications.js: Serialized queue to avoid duplicates. Native: creates prayer-times Android channel MAX importance, schedules by date trigger with data:{prayer,day,type}, cancels by content scan not just IDs. Web: setTimeout + Notification API + ServiceWorker + in-app toast fallback. HomeScreen.scheduleAll() schedules today-remaining + all tomorrow.
HomeScreen.js: Hero with glow, next prayer name, countdown interval 1s, StreakSummary, prayer list fajr,sunrise,dhuhr,asr,maghrib,isha, WisdomCard random Quran verse, inline reminder picker [5,10,15,30], notification banner, LocationPicker modal.
Components: PrayerRow - icon+time+صليت button, locked state, streak badge; LocationPicker - GPS + searchable grouped cities; WisdomCard, StreakSummary total/daily/best, CongratulationsModal with particles animation.
5. Config
app.json: slug salati, com.salati.app, portrait, dark, Android permissions POST_NOTIFICATIONS,SCHEDULE_EXACT_ALARM,LOCATION,RECEIVE_BOOT,VIBRATE, plugins notifications+location+splash, EAS projectId.
eas.json: development/preview/production profiles.
Build artifacts in root: app-debug.apk, app-release.apk.
Run: yarn start / yarn android / yarn web.
