// App.js - Main Entry Point
import 'react-native-gesture-handler';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { AppRegistry, Platform, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

import HomeScreen from './src/screens/HomeScreen';
import { NotificationProvider } from './src/context/NotificationContext';
import { PrayerProvider } from './src/context/PrayerContext';
import { resolveGpsLocation } from './src/utils/prayerTimes';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
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

export default function App() {
  // Set default location synchronously so PrayerProvider can render immediately (no 10s GPS block)
  const [location, setLocation] = useState({ latitude: 30.0444, longitude: 31.2357, name: 'القاهرة، مصر', method: 'Egyptian', timezone: 'Africa/Cairo', useDeviceTimezone: false, source: 'preset' });
  const [appReady, setAppReady] = useState(false);

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
      requestNotificationPermissionAsync();
      getLocation();
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Hide splash screen after layout
  useEffect(() => {
    if (location) {
      setAppReady(true);
      SplashScreen.hideAsync().catch(()=>{});
    }
  }, [location]);

  const getLocation = async () => {
    try {
      const { storageBackend } = await import('./src/utils/storage');
      const persistLocation = async (loc) => {
        try {
          const current = await storageBackend.getSettings();
          await storageBackend.saveSettings({ ...current, location: loc });
        } catch {}
      };
      const saved = await storageBackend.getSettings();
      if (saved.location && saved.location.latitude && saved.location.longitude) {
        setLocation(saved.location);
        return;
      }
      // Resolve the startup fix without blocking first paint for long
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      // Use high accuracy like the location picker (balanced one-shot fixes can
      // stall on some devices); 10s cap so startup is never blocked long.
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('gps-timeout')), 10000)),
      ]);
      // Set immediately with coordinates, then reverse geocode in background without blocking startup.
      // Persist both so a cold start restores the last GPS fix even if GPS is slow/unavailable next time.
      const immediate = resolveGpsLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLocation(immediate);
      persistLocation(immediate);
      Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }).then(rev => {
        const resolved = resolveGpsLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, address: rev && rev[0] ? rev[0] : null });
        setLocation(resolved);
        persistLocation(resolved);
      }).catch(()=>{});
    } catch (e) { console.log('[Salati] getLocation: FAILED', e); }
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
            <StatusBar style="light" />
            <Suspense fallback={<View style={{ flex:1, backgroundColor:'#0a0a0a', justifyContent:'center', alignItems:'center' }}><Text style={{ color:'#f0ece4', fontFamily:'Cairo' }}>جاري التحميل...</Text></View>}>
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
          </NavigationContainer>
        </PrayerProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
