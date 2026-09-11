// src/screens/SettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from '../context/NotificationContext';
import { usePrayer } from '../context/PrayerContext';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import { storageBackend } from '../utils/storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export default function SettingsScreen({ navigation }) {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    reminderMinutes,
    setReminderMinutes,
    recurringReminders,
    setRecurringReminders,
  } = useNotification();
  const { madhab, setMadhab, location } = usePrayer();

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

  const handleToggleNotifications = (val) => {
    // Persists via NotificationContext; HomeScreen cancels/re-schedules on change
    setNotificationsEnabled(val);
  };

  // On Android 12+ "alarms & reminders" exact timing is a separate permission;
  // without it the system can defer prayer notifications by minutes (Doze).
  const openExactAlarmSettings = async () => {
    try {
      await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
    } catch {
      try { await Linking.openSettings(); } catch {}
    }
  };

  const handleExport = async () => {
    try {
      const data = await storageBackend.exportData();
      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleTestNotification = async () => {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window) {
          if (Notification.permission !== 'granted') await Notification.requestPermission();
          new window.Notification('صلاتي - اختبار', { body: '🕌 الإشعارات تعمل! ستظهر صلاة الفجر بعد 5 ثوان' });
        }
        // Also schedule via our util for 5 sec
        const { schedulePrayerNotifications } = await import('../utils/notifications');
        const future = new Date(Date.now() + 5000);
        await schedulePrayerNotifications('اختبار', future, 0);
        Alert.alert('تم', 'سيظهر إشعار اختبار خلال 5 ثوان');
        return;
      }
      // Native: ensure channel and permission, then schedule 5s
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('خطأ', 'الرجاء السماح بالإشعارات من الإعدادات');
          return;
        }
      }
      await Notifications.scheduleNotificationAsync({
        content: { title: 'صلاتي - اختبار', body: '🕌 الإشعارات تعمل! (5 ثوان)', sound: 'default', priority: Notifications.AndroidNotificationPriority.HIGH, data: { test: true } },
        trigger: { type: 'date', date: new Date(Date.now() + 5000), channelId: 'prayer-times' },
      });
      Alert.alert('تم', 'سيظهر إشعار اختبار خلال 5 ثوان — اترك التطبيق في الخلفية');
    } catch (e) {
      Alert.alert('خطأ', String(e.message || e));
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure? This will delete all prayer history, streaks, and settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageBackend.clearAll();
            Alert.alert('Success', 'All data cleared');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.title}>الإعدادات</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التنبيهات</Text>
          
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>تنبيهات الصلاة</Text>
              <Text style={styles.settingDesc}>إشعارات قبل وأثناء وقت الصلاة</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#1a1a1a', true: '#d4956a' }}
              thumbColor={notificationsEnabled ? '#f0ece4' : '#8a857a'}
            />
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>تنبيه قبل الصلاة (دقائق)</Text>
              <Text style={styles.settingDesc}>كم دقيقة قبل وقت الصلاة</Text>
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
                    {min}
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
              <Text style={styles.settingLabel}>تذكير مستمر</Text>
              <Text style={styles.settingDesc}>تنبيه كل 10 دقائق لمدة ساعة إذا لم تصلِّ</Text>
            </View>
            <Switch
              value={recurringReminders}
              onValueChange={setRecurringReminders}
              trackColor={{ false: '#1a1a1a', true: '#d4956a' }}
              thumbColor={recurringReminders ? '#f0ece4' : '#8a857a'}
            />
          </View>

          {Platform.OS === 'android' && Platform.Version >= 31 && (
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>التنبيهات في وقتها</Text>
                <Text style={styles.settingDesc}>اسمح بـ"المنبهات ومواعيد التذكيرات" للنظام حتى تصل التنبيهات في وقتها بالضبط</Text>
              </View>
              <TouchableOpacity style={styles.option} onPress={openExactAlarmSettings}>
                <Text style={styles.optionText}>فتح</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#d4956a', marginTop: 16 }]} onPress={handleTestNotification}>
            <Text style={[styles.actionButtonText, { color: '#0a0a0a' }]}>🔔 اختبار الإشعارات (5 ثوان)</Text>
          </TouchableOpacity>
        </View>

        {/* Streak Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>السلاسل (Streaks)</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>كيف تعمل السلاسل؟</Text>
            <Text style={styles.infoText}>
              • اضغط على "صليت" عند إتمام كل صلاة{'\n'}
              • السلسلة تزيد كل يوم تحافظ على الصلاة{'\n'}
              • إذا فاتك يوم، السلسلة تبدأ من جديد{'\n'}
              • التذكيرات تتوقف عند إتمام الصلاة
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
            <Text style={styles.infoLabel}>محرك الحساب</Text>
            <Text style={styles.infoValue}>Adhan العالمي</Text>
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
          <Text style={styles.footerText}>صلاتي — ليكن قلبك مع الله</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: '#d4956a',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontFamily: 'Amiri',
    fontSize: 20,
    fontWeight: '700',
    color: '#f0ece4',
  },
  section: {
    backgroundColor: '#141414',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#4a4740',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#f0ece4',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 11,
    color: '#8a857a',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    minWidth: 36,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#d4956a',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a857a',
  },
  optionTextActive: {
    color: '#0a0a0a',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4956a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#8a857a',
    lineHeight: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  actionButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f0ece4',
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8a857a',
  },
  infoValue: {
    fontSize: 14,
    color: '#f0ece4',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 100, 100, 0.1)',
    borderColor: 'rgba(255, 100, 100, 0.3)',
    borderWidth: 1,
  },
  dangerText: {
    color: '#ff6464',
  },
});
