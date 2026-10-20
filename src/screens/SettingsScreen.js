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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from '../context/NotificationContext';
import { usePrayer } from '../context/PrayerContext';
import { PRAYER_NAMES } from '../utils/prayerTimes';
import { storageBackend } from '../utils/storage';

export default function SettingsScreen({ navigation }) {
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    reminderMinutes,
    setReminderMinutes,
    recurringReminders,
    setRecurringReminders,
  } = useNotification();
  const { madhab, setMadhab, location, C } = usePrayer();
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

  const handleToggleNotifications = (val) => {
    // Persists via NotificationContext; HomeScreen cancels/re-schedules on change
    setNotificationsEnabled(val);
  };

  const handleExport = async () => {
    try {
      const data = await storageBackend.exportData();
      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
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
              <Text style={styles.settingDesc}>تنبيه عند دخول كل صلاة</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: C.surface, true: C.accent }}
              thumbColor={notificationsEnabled ? C.text : C.textSecondary}
            />
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
              <Text style={styles.settingLabel}>إعادة التذكير</Text>
              <Text style={styles.settingDesc}>كل 10 دقائق حتى تُصلَّى</Text>
            </View>
            <Switch
              value={recurringReminders}
              onValueChange={setRecurringReminders}
              trackColor={{ false: C.surface, true: C.accent }}
              thumbColor={recurringReminders ? C.text : C.textSecondary}
            />
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

const getStyles = (C) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
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
    color: C.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontFamily: 'Amiri',
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
  },
  section: {
    backgroundColor: C.elevated,
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
    color: C.textMuted,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.surface,
    gap: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: C.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 11,
    color: C.textSecondary,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: C.surface,
    minWidth: 36,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: C.accent,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSecondary,
  },
  optionTextActive: {
    color: C.bg,
  },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.accent,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.surface,
  },
  actionButton: {
    backgroundColor: C.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: C.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: C.text,
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
