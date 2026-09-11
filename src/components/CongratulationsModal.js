// src/components/CongratulationsModal.js - web .congrats-modal exact
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from 'react-native';

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

const PARTICLES = [
  { left: '10%', color: '#d4956a', delay: 0 },
  { left: '20%', color: '#f0d060', delay: 300 },
  { left: '30%', color: '#d4956a', delay: 600 },
  { left: '40%', color: '#e8a070', delay: 900 },
  { left: '50%', color: '#f0d060', delay: 1200 },
  { left: '60%', color: '#d4956a', delay: 200 },
  { left: '70%', color: '#e8a070', delay: 500 },
  { left: '80%', color: '#f0d060', delay: 800 },
  { left: '90%', color: '#d4956a', delay: 1100 },
];

export default function CongratulationsModal({ visible, dailyStreak, onClose }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const countScale = useRef(new Animated.Value(0.5)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;

  const message = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], [visible]);

  useEffect(() => {
    if (visible) {
      const pop = Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 400, easing: Easing.ease, useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1, duration: 500, delay: 50, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), useNativeDriver: false }),
        Animated.timing(rotate, { toValue: 1, duration: 500, delay: 50, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), useNativeDriver: false }),
        Animated.timing(countScale, { toValue: 1, duration: 500, delay: 300, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.timing(countOpacity, { toValue: 1, duration: 500, delay: 300, useNativeDriver: false }),
      ]);
      pop.start();

      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(iconBounce, { toValue: -10, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(iconBounce, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      bounce.start();

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.8, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glowOpacity, { toValue: 0.3, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      glow.start();
      // Stop on unmount/hide: orphaned native nodes race the native animated
      // manager on reload (connect/disconnectAnimatedNodes crashes).
      return () => { pop.stop(); bounce.stop(); glow.stop(); };
    } else {
      overlayOpacity.setValue(0);
      scale.setValue(0.5);
      rotate.setValue(0);
      iconBounce.setValue(0);
      countScale.setValue(0.5);
      countOpacity.setValue(0);
    }
  }, [visible]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-5deg', '2deg', '0deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View style={[styles.content, { transform: [{ scale }, { rotate: rotateInterpolate }] }]}>
          <View style={styles.particles} pointerEvents="none">
            {PARTICLES.map((p, i) => (
              <Particle key={i} left={p.left} color={p.color} delay={p.delay} visible={visible} />
            ))}
          </View>

          <Animated.Text style={[styles.icon, { transform: [{ translateY: iconBounce }] }]}>🎉</Animated.Text>
          <Text style={styles.title}>مَا شَاءَ اللَّهُ!</Text>
          <Text style={styles.subtitle}>لقد أكملت جميع الصلوات اليوم</Text>
          <View style={styles.daysContainer}>
            <Animated.Text style={[styles.daysNumber, { opacity: countOpacity, transform: [{ scale: countScale }] }]}>{dailyStreak}</Animated.Text>
            <Text style={styles.daysLabel}>أيام متتالية</Text>
          </View>
          <View style={styles.messageBox}>
            <Text style={styles.message}>{message}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function Particle({ left, color, delay, visible }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      translateY.setValue(-100);
      rotate.setValue(0);
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(translateY, { toValue: 400, duration: 3000, delay, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(rotate, { toValue: 720, duration: 3000, delay, easing: Easing.linear, useNativeDriver: false }),
        Animated.sequence([
          Animated.delay(delay + 2500),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, delay]);

  const rotateInterpolate = rotate.interpolate({ inputRange: [0, 720], outputRange: ['0deg', '720deg'] });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          left,
          transform: [{ translateY }, { rotate: rotateInterpolate }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: 360,
    maxWidth: '92%',
    borderWidth: 2,
    borderColor: '#d4956a',
    overflow: 'hidden',
    shadowColor: '#d4956a',
    shadowOpacity: 0.3,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  particles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  particle: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: 0 },
  icon: { fontSize: 64, marginBottom: 16, zIndex: 1, textAlign: 'center' },
  title: {
    fontFamily: 'Amiri',
    fontSize: 32,
    fontWeight: '700',
    color: '#d4956a',
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
    zIndex: 1,
  },
  subtitle: { fontFamily: 'Cairo', fontSize: 15.2, color: '#8a857a', marginBottom: 24, textAlign: 'center', writingDirection: 'rtl', zIndex: 1 },
  daysContainer: {
    backgroundColor: 'rgba(212, 149, 106, 0.12)',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(212,149,106,0.2)',
    zIndex: 1,
  },
  daysNumber: { fontFamily: 'Cairo', fontSize: 64, fontWeight: '700', color: '#d4956a', lineHeight: 64, textAlign: 'center' },
  daysLabel: { fontFamily: 'Cairo', fontSize: 13.6, color: '#8a857a', marginTop: 8, fontWeight: '600', writingDirection: 'rtl', textAlign: 'center' },
  messageBox: { backgroundColor: 'rgba(212,149,106,0.08)', borderRadius: 12, padding: 16, marginBottom: 28, width: '100%', zIndex: 1 },
  message: { fontFamily: 'Amiri', fontSize: 17.6, lineHeight: 35.2, color: '#f0ece4', textAlign: 'center', writingDirection: 'rtl' },
  closeButton: { backgroundColor: '#d4956a', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 16, zIndex: 1 },
  closeButtonText: { fontFamily: 'Cairo', color: '#0a0a0a', fontSize: 16, fontWeight: '700', writingDirection: 'rtl', textAlign: 'center' },
});
