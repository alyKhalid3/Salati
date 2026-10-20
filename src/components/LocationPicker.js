// src/components/LocationPicker.js - matches web .location-modal exactly
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { CITIES } from '../utils/cities';
import { usePrayer } from '../context/PrayerContext';
import { RADII } from '../utils/theme';
import { resolveGpsLocation } from '../utils/prayerTimes';

function LocationPicker({ visible, onClose, onSelect, currentLocation }) {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const [query, setQuery] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((c) => {
      if (!groups[c.country]) groups[c.country] = [];
      groups[c.country].push(c);
    });
    return groups;
  }, [filtered]);

  const handleGps = async () => {
    if (Platform.OS === 'web') {
      setGpsLoading(true);
      try {
        const pos = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        onSelect(resolveGpsLocation({ latitude: lat, longitude: lng }));
        setQuery(''); onClose();
      } catch (e) { console.log('GPS error', e); } finally { setGpsLoading(false); }
      return;
    }
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      let address = null;
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        if (rev && rev[0]) address = rev[0];
      } catch {}
      onSelect(resolveGpsLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, address }));
      setQuery(''); onClose();
    } catch (e) { console.log('GPS error', e); } finally { setGpsLoading(false); }
  };

  const handleCityPress = (city) => {
    onSelect({ latitude: city.lat, longitude: city.lng, name: `${city.name}، ${city.country}`, method: city.method || 'Egyptian', timezone: city.timezone || 'Africa/Cairo', useDeviceTimezone: false, source: 'preset' });
    setQuery(''); onClose();
  };
  const handleClose = () => { setQuery(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>اختر موقعك</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.gpsBtn} onPress={handleGps} disabled={gpsLoading} activeOpacity={0.8}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={2}>
              <Circle cx={12} cy={12} r={10} /><Circle cx={12} cy={12} r={3} /><Path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </Svg>
            <Text style={styles.gpsLabel}>{gpsLoading ? 'جاري تحديد موقعك...' : 'استخدم موقعي الحالي'}</Text>
            {!gpsLoading && <View style={styles.gpsBadge}><Text style={styles.gpsBadgeText}>GPS تلقائي</Text></View>}
            {gpsLoading && <ActivityIndicator size="small" color={C.accent} />}
          </TouchableOpacity>
          <View style={styles.searchWrap}>
            <View style={styles.searchIcon}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth={2}>
                <Circle cx={11} cy={11} r={8} /><Path d="m21 21-4.35-4.35" />
              </Svg>
            </View>
            <TextInput style={styles.searchInput} placeholder="ابحث عن مدينة..." placeholderTextColor={C.textMuted} value={query} onChangeText={setQuery} textAlign="right" />
          </View>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد نتائج لـ "{query}"</Text>
            ) : (
              Object.keys(grouped).map((country) => (
                <View key={country}>
                  <Text style={styles.groupTitle}>{country}</Text>
                  {grouped[country].map((city) => {
                    const isActive = currentLocation && Math.abs(currentLocation.latitude - city.lat) < 0.01 && Math.abs(currentLocation.longitude - city.lng) < 0.01;
                    return (
                      <TouchableOpacity key={`${city.name}-${city.country}`} style={[styles.cityItem, isActive && styles.cityItemActive]} onPress={() => handleCityPress(city)} activeOpacity={0.7}>
                        <View style={styles.cityMain}>
                          <Text style={[styles.cityName, isActive && styles.cityNameActive]}>{city.name}</Text>
                          <Text style={styles.cityCountry}>{city.country}</Text>
                        </View>
                        <View style={[styles.check, isActive && styles.checkActive]}><Text style={styles.checkText}>✓</Text></View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
          <Text style={styles.hint}>يتم حفظ موقعك على جهازك فقط</Text>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (C) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: C.scrim },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 28, maxHeight: '78%', gap: 14, boxShadow: C.raise },
  handle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: C.surface2, alignSelf: 'center', marginTop: -8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' },
  headerTitle: { fontFamily: 'Cairo', fontSize: 17, fontWeight: '700', color: C.text, writingDirection: 'rtl' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, boxShadow: C.raiseSm, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingVertical: 13, paddingHorizontal: 16, backgroundColor: C.bg, boxShadow: C.raiseSm, borderRadius: RADII.md },
  gpsLabel: { flex: 1, fontFamily: 'Cairo', fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right', writingDirection: 'rtl' },
  gpsBadge: { backgroundColor: C.accentFaint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  gpsBadgeText: { fontFamily: 'Cairo', fontSize: 10, color: C.accent, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: RADII.sm, boxShadow: C.groove, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginLeft: 8 },
  searchInput: { flex: 1, fontFamily: 'Cairo', color: C.text, fontSize: 14, paddingVertical: 8, writingDirection: 'rtl' },
  list: { maxHeight: 280 },
  groupTitle: { fontFamily: 'Cairo', fontSize: 10.4, fontWeight: '700', letterSpacing: 1.5, color: C.textMuted, paddingTop: 10, paddingBottom: 6, textTransform: 'uppercase', textAlign: 'right', writingDirection: 'rtl' },
  cityItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 12, borderRadius: RADII.sm },
  cityItemActive: { backgroundColor: C.accentFaint, borderWidth: 1, borderColor: C.goldFaint },
  cityMain: { gap: 2, alignItems: 'flex-end', flex: 1, direction: 'rtl' },
  cityName: { fontFamily: 'Cairo', fontSize: 14.4, fontWeight: '600', color: C.text, writingDirection: 'rtl', textAlign: 'right' },
  cityNameActive: { color: C.accent, fontWeight: '700' },
  cityCountry: { fontFamily: 'Cairo', fontSize: 11.2, color: C.textSecondary, writingDirection: 'rtl', textAlign: 'right' },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', opacity: 0, marginLeft: 12 },
  checkActive: { opacity: 1 },
  checkText: { color: C.onGreen, fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', paddingVertical: 24, color: C.textMuted, fontSize: 14, fontFamily: 'Cairo', writingDirection: 'rtl' },
  hint: { textAlign: 'center', fontSize: 10, color: C.textMuted, paddingTop: 4, fontFamily: 'Cairo', writingDirection: 'rtl' },
});

export default React.memo(LocationPicker);
