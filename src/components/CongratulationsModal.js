// src/components/CongratulationsModal.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';

const MESSAGES = [
  "مَا شَاءَ اللَّهُ! لَكَ الْمَدْحُ وَالشُّكْرُ يَا عَبْدَ اللَّهِ",
  "أَحْسَنتَ! جَزَاكَ اللَّهُ خَيْرًا عَلَى حِفْظِكَ لِصَلَوَاتِكَ",
  "بِالْإِصْرَارِ وَالْإِخْلَاصِ نَبْنِي عِبَادَةً وَتَقْوَى",
  "لَا تَكُنْ مِمَّنْ يُؤَخِّرُ الصَّلَاةَ فَقَدْ قَضَيْتَ يَوْمَكَ بِإِيمَانٍ",
  "هَنِيئًا لَكَ! كُلُّ يَوْمٍ تُتِمُّ فِيهِ صَلَاتَكَ يَقْتَرِبُ فِيهِ مِنَ اللَّهِ خُطْوَةً",
  "أَنْتَ مِنَ الَّذِينَ يُقِيمُونَ الصَّلَاةَ وَلَا يُضِيعُونَهَا، فَبُورِكَ لَكَ",
  "صَبْرُكَ وَاجْتِهَادُكَ فِي حِفْظِ الصَّلَاةِ لَهُ أَجْرٌ عَظِيمٌ عِنْدَ اللَّهِ",
  "كُلُّ صَلَاةً تُصَلِّهَا فِي وَقْتِهَا نُورٌ لَكَ فِي الدُّنْيَا وَالْآخِرَةِ",
  "مُدَامٌ هُوَ الْخَيْرُ لَكَ مَا دُمْتَ عَلَى هَذِهِ الْحَالِ، فَأَبْشِرْ بِخَيْرِ",
  "إِسْتَمِرُّ عَلَى هَذِهِ الْحَالِ فَإِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
];

export default function CongratulationsModal({ visible, dailyStreak, onClose }) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.icon}>🎉</Text>
          <Text style={styles.title}>مَا شَاءَ اللَّهُ!</Text>
          <Text style={styles.subtitle}>لقد أكملت جميع الصلوات اليوم</Text>
          <View style={styles.daysContainer}>
            <Text style={styles.daysNumber}>{dailyStreak}</Text>
            <Text style={styles.daysLabel}>أيام متتالية</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 320,
    borderWidth: 1,
    borderColor: '#d4956a',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Amiri',
    fontSize: 24,
    fontWeight: '700',
    color: '#d4956a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8a857a',
    marginBottom: 24,
  },
  daysContainer: {
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  daysNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#d4956a',
    lineHeight: 1,
  },
  daysLabel: {
    fontSize: 12,
    color: '#8a857a',
    marginTop: 4,
  },
  message: {
    fontFamily: 'Amiri',
    fontSize: 16,
    lineHeight: 28,
    color: '#f0ece4',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#d4956a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '700',
  },
});
