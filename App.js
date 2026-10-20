// App.js - Main Entry Point
import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { AppRegistry, Platform, Text, View, Animated, StyleSheet, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

import HomeScreen from './src/screens/HomeScreen';
import BootLoader from './src/components/BootLoader';
import { NotificationProvider } from './src/context/NotificationContext';
import { PrayerProvider, usePrayer } from './src/context/PrayerContext';
import { resolveGpsLocation } from './src/utils/prayerTimes';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { storageBackend } from './src/utils/storage';
SplashScreen.preventAutoHideAsync().catch(()=>{});
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen'));

const Stack = createNativeStackNavigator();

// Configure notification handler - show even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Status bar icons follow the effective theme (dark icons on daylight).
function ThemedStatusBar() {
  try {
    const { effectiveTheme } = usePrayer();
    return <StatusBar style={effectiveTheme === 'light' ? 'dark' : 'light'} />;
  } catch {
    return <StatusBar style="light" />;
  }
}

// Sun-driven theme crossfade: when day flips to night (or back), hold a
// full-screen wash of the outgoing background and fade it out over ~1s,
// so the switch glides instead of snapping.
function ThemeFade() {
  const { effectiveTheme, C } = usePrayer();
  const theme = effectiveTheme;
  const bg = (C && C.bg) || '#0a0a0a';
  const opacity = useRef(new Animated.Value(0)).current;
  const [wash, setWash] = useState(bg);
  const prevTheme = useRef(theme);
  const prevBg = useRef(bg);
  useEffect(() => {
    if (prevTheme.current && theme && prevTheme.current !== theme) {
      setWash(prevBg.current);
      opacity.setValue(1);
      const fade = Animated.timing(opacity, { toValue: 0, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true });
      fade.start();
      return () => fade.stop();
    }
    prevTheme.current = theme;
    prevBg.current = bg;
    return undefined;
  }, [theme]);
  if (!theme) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: wash, opacity, zIndex: 99, elevation: 99 }]}
    />
  );
}

export default function App() {
  // Start with no location so first paint never flashes the Cairo default:
  // the saved location (or GPS fix) resolves first, splash hides after.
  const CAIRO_FALLBACK = { latitude: 30.0444, longitude: 31.2357, name: 'القاهرة، مصر', method: 'Egyptian', timezone: 'Africa/Cairo', useDeviceTimezone: false, source: 'preset' };
  const [location, setLocation] = useState(null);
  const [locationReady, setLocationReady] = useState(false);
  const resolvedRef = useRef(false);
  const markResolved = (loc) => {
    if (loc) setLocation(loc);
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      setLocationReady(true);
    }
  };
  const [appReady, setAppReady] = useState(false);
  const [bootMinDone, setBootMinDone] = useState(false);

  // Web: match index.html lang/dir + load Amiri/Cairo - batched to avoid forced reflow
  useEffect(() => {
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        try {
          const html = document.documentElement;
          const body = document.body;
          const hasFontLink = !!document.querySelector('link[href*="fonts.googleapis.com"]');
          const hasKeyframes = !!document.getElementById('salati-keyframes');
          const root = document.getElementById('root');
          html.lang = 'ar';
          html.dir = 'rtl';
          html.style.fontSize = '16px';
          body.style.backgroundColor = '#0a0a0a';
          body.style.color = '#f0ece4';
          body.style.fontFamily = "'Cairo', sans-serif";
          body.dir = 'rtl';
          if (!hasFontLink) {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@200;300;400;600;700&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          if (root) {
            root.style.maxWidth = '420px';
            root.style.margin = '0 auto';
            root.style.backgroundColor = '#0a0a0a';
            root.style.minHeight = '100vh';
            root.style.position = 'relative';
            root.style.direction = 'rtl';
          }
          if (!hasKeyframes) {
            const s = document.createElement('style');
            s.id = 'salati-keyframes';
            s.textContent = `
              @keyframes fadeUp { from { opacity:0; transform: translateY(20px)} to {opacity:1; transform:translateY(0)}}
              @keyframes fadeDown { from {opacity:0; transform:translateY(-20px)} to {opacity:1; transform:translateY(0)}}
              @keyframes slideIn { from {opacity:0; transform:translateX(-10px)} to {opacity:1; transform:translateX(0)}}
              @keyframes lineGrow { from {transform:scaleX(0)} to {transform:scaleX(1)}}
              @keyframes lineGrowY { from {transform:scaleY(0)} to {transform:scaleY(1)}}
              @keyframes lineExpand { from {transform:scaleX(0)} to {transform:scaleX(1)}}
              @keyframes breathe { 0%,100% {opacity:0.6; transform:translate(-50%,-50%) scale(1)} 50% {opacity:1; transform:translate(-50%,-50%) scale(1.05)}}
              @keyframes pulse { 0%,100% {opacity:1} 50% {opacity:0.85}}
              @keyframes highlight { from {background:transparent} to {background:rgba(212,149,106,0.15)}}
              @keyframes bounce { 0%,100% {transform:translateY(0)} 50% {transform:translateY(-10px)}}
              @keyframes glow { 0% {text-shadow:0 0 10px rgba(212,149,106,0.3)} 100% {text-shadow:0 0 30px rgba(212,149,106,0.8)}}
              @keyframes rotateGlow { 0% {transform:rotate(0deg)} 100% {transform:rotate(360deg)}}
              @keyframes fall { 0% {transform:translateY(-100px) rotate(0deg); opacity:1} 100% {transform:translateY(400px) rotate(720deg); opacity:0}}
              @keyframes congratsPop { 0% {transform:scale(0.5) rotate(-5deg); opacity:0} 50% {transform:scale(1.05) rotate(2deg)} 100% {transform:scale(1) rotate(0deg); opacity:1}}
              @keyframes countUp { 0% {transform:scale(0.5); opacity:0} 50% {transform:scale(1.2)} 100% {transform:scale(1); opacity:1}}
            `;
            document.head.appendChild(s);
          }
        } catch {}
      });
    }
  }, []);

  useEffect(() => {
    // Defer heavy work until after first paint
    const t = setTimeout(() => {
      // Don't request notification permission on startup — it blocks the app
      // behind a system dialog. Only request when user enables notifications
      // in settings (see NotificationContext).
      getLocation();
    }, 500);
    // Let the boot wordmark fill play out (~3s) before revealing home.
    const minTime = setTimeout(() => setBootMinDone(true), 3200);
    // Safety net: never leave the user on splash — fall back to Cairo.
    const fallback = setTimeout(() => {
      if (!resolvedRef.current) markResolved(CAIRO_FALLBACK);
    }, 2500);
    return () => { clearTimeout(t); clearTimeout(minTime); clearTimeout(fallback); };
  }, []);

  // Reveal home only when the location is in AND the boot fill has played.
  // The native splash hides as soon as the location is in so the Salati
  // fill loader (rendered underneath it) gets its moment before home.
  const revealed = appReady && bootMinDone;
  useEffect(() => {
    if (locationReady && location) setAppReady(true);
  }, [locationReady, location]);
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(()=>{});
    }
  }, [appReady]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  };

  const getLocation = async () => {
    try {
      // Timeout after 3s - never let storage hang startup
      const saved = await Promise.race([
        storageBackend.getSettings(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('storage-timeout')), 3000)),
      ]);
      if (saved && saved.location && saved.location.latitude && saved.location.longitude) {
        markResolved(saved.location);
        return;
      }
      markResolved(CAIRO_FALLBACK);
    } catch (e) {
      console.log('[Salati] getLocation: FAILED', e);
      markResolved(CAIRO_FALLBACK);
    }
  };

  const requestNotificationPermissionAsync = async () => {
    if (Platform.OS === 'web') return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      console.log('Notification permission:', finalStatus);
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <PrayerProvider location={location}>
          <NavigationContainer>
            <ThemedStatusBar />
            <ThemeFade />
            {!revealed ? (
              <BootLoader />
            ) : (
            <Suspense fallback={<View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0a0a0a' },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
              </Stack.Navigator>
            </Suspense>
            )}
          </NavigationContainer>
        </PrayerProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
