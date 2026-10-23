// src/screens/SettingsScreen.js — settings in the Soft Press world.
// Sections are raised slabs; a selected option is PRESSED into its row;
// destructive action keeps the soft coral. All copy via strings/tokens.
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from '../context/NotificationContext';
import { usePrayer } from '../context/PrayerContext';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import { FONTS, RADII } from '../utils/theme';
import { S, toArabicDigits } from '../utils/strings';
import Toggle from '../components/Toggle';
import { storageBackend } from '../utils/storage';
import { cancelAllNotifications } from '../utils/notifications';

export default function SettingsScreen() {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    reminderMinutes,
    setReminderMinutes,
    recurringReminders,
    setRecurringReminders,
    resetToDefaults,
  } = useNotification();
  const { madhab, setMadhab, location, C, clearPrayerMemory } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);

  const reminderOptions = [5, 10, 15, 30];
  const methodLabels = {
    Egyptian: 'الهيئة المصرية العامة للمساحة',
    MuslimWorldLeague: 'رابطة العالم الإسلامي',
    UmmAlQura: 'جامعة أم القرى',
    NorthAmerica: 'أمريكا الشمالية (ISNA)',
    Turkey: 'تركيا (Diyanet)',
    Tehran: 'طهران',
    Karachi: 'كراتشي',
    Singapore: 'سنغافورة',
    Qatar: 'قطر',
    Kuwait: 'الكويت',
  };
  const activeMethod = methodLabels[location?.method] || methodLabels.MuslimWorldLeague;
  const activeMadhab = madhab === 'Hanafi' ? 'الحنفي' : 'الشافعي';
  const coordinateLabel = location && isFinite(Number(location.latitude)) && isFinite(Number(location.longitude))
    ? `${Number(location.latitude).toFixed(4)}، ${Number(location.longitude).toFixed(4)}`
    : '--';

  const handleToggleNotifications = async (val) => {
    if (val && Platform.OS !== 'web') {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          setNotificationsEnabled(false);
          Alert.alert('التنبيهات', 'لم يُمنح إذن التنبيهات. فعّله من إعدادات الجهاز ثم أعد المحاولة.');
          return;
        }
      } catch {
        setNotificationsEnabled(false);
        return;
      }
    } else if (val && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setNotificationsEnabled(false);
          return;
        }
      } catch {
        setNotificationsEnabled(false);
        return;
      }
    }
    setNotificationsEnabled(val);
  };

  const handleExport = async () => {
    try {
      const data = await storageBackend.exportData();
      const text = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shurooq-backup.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      await Share.share({ message: text, title: S.appName });
    } catch (error) {
      const message = error && error.message ? String(error.message) : '';
      if (/cancel|dismiss|abort/i.test(message)) return;
      Alert.alert('خطأ', 'تعذّر تصدير البيانات');
    }
  };

  const tell = (title, message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const wipeData = async () => {
    const ok = await storageBackend.clearAll();
    if (!ok) {
      tell('خطأ', 'تعذّر مسح البيانات');
      return;
    }
    clearPrayerMemory();
    resetToDefaults();
    await cancelAllNotifications();
    // The city is not prayer history. Write it back so the next launch
    // does not fall through to "never chosen" and start GPS again.
    if (location) {
      await storageBackend.saveSettings({
        reminderMinutes: 10,
        notificationsEnabled: true,
        recurringReminders: true,
        calculationMethod: location.method || 'Egyptian',
        madhab: 'Shafi',
        location,
        theme: 'dark',
        language: 'ar',
      });
    }
    tell('تم', 'تم مسح كل البيانات');
  };

  const handleClearData = () => {
    const message = 'هل أنت متأكد؟ سيُحذف سجل الصلوات والسلاسل والإعدادات.';
    // Alert.alert is a no-op on web (only ios and android are implemented).
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) wipeData();
      return;
    }
    Alert.alert(
      'مسح كل البيانات',
      message,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'محو', style: 'destructive', onPress: wipeData },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 132 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>الإعدادات</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التنبيهات</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>تنبيهات الصلاة</Text>
              <Text style={styles.settingDesc}>تنبيه عند دخول كل صلاة</Text>
            </View>
            <Toggle value={notificationsEnabled} onValueChange={handleToggleNotifications} accessibilityLabel="تنبيهات الصلاة" />
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>التذكير قبل الصلاة</Text>
              <Text style={styles.settingDesc}>قبل الوقت بـ</Text>
            </View>
            <View style={styles.optionsRow}>
              {reminderOptions.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.option,
                    reminderMinutes === min && styles.optionActive,
                  ]}
                  onPress={() => setReminderMinutes(min)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      reminderMinutes === min && styles.optionTextActive,
                    ]}
                  >
                    {toArabicDigits(min)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>حساب العصر</Text>
              <Text style={styles.settingDesc}>شافعي أو حنفي</Text>
            </View>
            <View style={styles.optionsRow}>
              {[{ value: 'Shafi', label: 'شافعي' }, { value: 'Hanafi', label: 'حنفي' }].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    madhab === option.value && styles.optionActive,
                  ]}
                  onPress={() => setMadhab(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      madhab === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>إعادة التذكير</Text>
              <Text style={styles.settingDesc}>كل ١٠ دقائق حتى تُصلَّى</Text>
            </View>
            <Toggle value={recurringReminders} onValueChange={setRecurringReminders} accessibilityLabel="إعادة التذكير" />
          </View>
        </View>

        {/* Streak Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>السلاسل</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>كيف تعمل السلاسل؟</Text>
            <Text style={styles.infoText}>
              • صلِّ كل صلاة في وقتها ثم اضغط "صليت"{'\n'}
              • أكمل الصلوات الخمس في اليوم لتزيد سلسلة الأيام{'\n'}
              • إذا فاتك يوم تعود السلسلة إلى الصفر
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حول التطبيق</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الإصدار</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>طريقة الحساب</Text>
            <Text style={styles.infoValue}>{activeMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>المذهب</Text>
            <Text style={styles.infoValue}>{activeMadhab}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الإحداثيات</Text>
            <Text style={styles.infoValue}>{coordinateLabel}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{S.footerLine}</Text>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة البيانات</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
            <Text style={styles.actionButtonText}>تصدير البيانات</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleClearData}>
            <Text style={[styles.actionButtonText, styles.dangerText]}>مسح جميع البيانات</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: FONTS.arabic,
    fontSize: 26,
    fontWeight: '700',
    color: C.text,
    writingDirection: 'rtl',
  },
  section: {
    backgroundColor: C.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: C.goldFaint,
    padding: 16,
    boxShadow: C.raiseSm,
  },
  sectionTitle: {
    fontFamily: 'Cairo',
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
    direction: 'rtl',
  },
  settingLabel: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: C.text,
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  settingDesc: {
    fontFamily: 'Cairo',
    fontSize: 11,
    color: C.textSecondary,
    writingDirection: 'rtl',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    direction: 'rtl',
  },
  option: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADII.sm,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.hairline,
    minWidth: 44,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: C.green,
    borderColor: C.accentGold,
  },
  optionText: {
    fontFamily: 'Cairo',
    fontSize: 12.4,
    fontWeight: '600',
    color: C.textSecondary,
  },
  optionTextActive: {
    color: C.onGreen,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: C.surface2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: C.hairlineSoft,
    padding: 14,
  },
  infoTitle: {
    fontFamily: 'Cairo',
    fontSize: 13,
    fontWeight: '700',
    color: C.accent,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  infoText: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    direction: 'rtl',
  },
  actionButton: {
    backgroundColor: C.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: C.hairlineSoft,
    marginTop: 12,
  },
  actionButtonText: {
    fontFamily: 'Cairo',
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  infoLabel: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: C.textSecondary,
    writingDirection: 'rtl',
  },
  infoValue: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  dangerButton: {
    backgroundColor: C.bg,
  },
  dangerText: {
    color: C.danger,
  },
  footer: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Cairo',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
});
