// src/components/CongratulationsModal.js - web .congrats-modal exact
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';

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
  { left: '10%', color: '#d4956a', delay: 0, size: 10 },
  { left: '20%', color: '#f0d060', delay: 300, size: 6 },
  { left: '30%', color: '#d4956a', delay: 600, size: 8 },
  { left: '40%', color: '#e8a070', delay: 900, size: 10 },
  { left: '50%', color: '#f0d060', delay: 1200, size: 6 },
  { left: '60%', color: '#d4956a', delay: 200, size: 8 },
  { left: '70%', color: '#e8a070', delay: 500, size: 10 },
  { left: '80%', color: '#f0d060', delay: 800, size: 6 },
  { left: '90%', color: '#d4956a', delay: 1100, size: 8 },
];

function CongratulationsModal({ visible, dailyStreak, onClose }) {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
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
        Animated.timing(overlayOpacity, { toValue: 1, duration: 400, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 500, delay: 50, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 500, delay: 50, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275), useNativeDriver: true }),
        Animated.timing(countScale, { toValue: 1, duration: 500, delay: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(countOpacity, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
      ]);
      pop.start();

      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(iconBounce, { toValue: -10, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(iconBounce, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      bounce.start();

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.8, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.3, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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
              <Particle key={i} left={p.left} color={p.color} delay={p.delay} size={p.size} visible={visible} />
            ))}
          </View>

          <View style={styles.medallionWrap} pointerEvents="none">
            <Animated.View style={[styles.medallionGlow, { opacity: glowOpacity }]}>
              <Svg width={150} height={150} viewBox="0 0 150 150">
                <Defs>
                  <RadialGradient id="congratsGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={C.accent} stopOpacity={0.35} />
                    <Stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={75} cy={75} r={75} fill="url(#congratsGlow)" />
              </Svg>
            </Animated.View>
            <Animated.View style={[styles.medallion, { transform: [{ translateY: iconBounce }] }]}>
              <View style={styles.medallionRing} />
              <Svg width={60} height={60} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={1.4}>
                <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                <Path d="M18.2 3.5l.8 1.7 1.9.3-1.4 1.3.4 1.9-1.7-.9-1.7.9.4-1.9-1.4-1.3 1.9-.3z" fill={C.accentGold} stroke="none" />
              </Svg>
            </Animated.View>
          </View>
          <Text style={styles.title}>ما شاء الله</Text>
          <Text style={styles.subtitle}>لقد أكملت جميع الصلوات اليوم</Text>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerDiamond}>◆</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.daysContainer}>
            <Animated.Text style={[styles.daysNumber, { opacity: countOpacity, transform: [{ scale: countScale }] }]}>{dailyStreak}</Animated.Text>
            <Text style={styles.daysLabel}>أيام متتالية</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function Particle({ left, color, delay, size, visible }) {
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
        Animated.timing(translateY, { toValue: 400, duration: 3000, delay, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 720, duration: 3000, delay, easing: Easing.linear, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(delay + 2500),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
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
        particleStyles.particle,
        {
          backgroundColor: color,
          left,
          width: size || 10,
          height: size || 10,
          borderRadius: (size || 10) / 2,
          transform: [{ translateY }, { rotate: rotateInterpolate }],
          opacity,
        },
      ]}
    />
  );
}

const getStyles = (C) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.scrimStrong,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: C.surface,
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: 360,
    maxWidth: '92%',
    borderWidth: 2,
    borderColor: C.accent,
    overflow: 'hidden',
    shadowColor: C.accent,
    shadowOpacity: 0.3,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  particles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  medallionWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 8, zIndex: 1 },
  medallionGlow: { position: 'absolute' },
  medallion: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.accent,
    borderTopColor: C.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  medallionRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: C.hairlineSoft,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16, zIndex: 1, direction: 'rtl' },
  dividerLine: { width: 56, height: 1, backgroundColor: C.hairlineSoft },
  dividerDiamond: { fontSize: 8, color: C.accent, textAlign: 'center' },
  title: {
    fontFamily: 'Amiri',
    fontSize: 32,
    fontWeight: '700',
    color: C.accent,
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
    zIndex: 1,
  },
  subtitle: { fontFamily: 'Cairo', fontSize: 15.2, color: C.textSecondary, marginBottom: 24, textAlign: 'center', writingDirection: 'rtl', zIndex: 1 },
  daysContainer: {
    alignItems: 'center',
    marginBottom: 4,
    zIndex: 1,
  },
  daysNumber: { fontFamily: 'Cairo', fontSize: 72, fontWeight: '700', color: C.accent, lineHeight: 72, textAlign: 'center', fontVariant: ['tabular-nums'] },
  daysLabel: { fontFamily: 'Cairo', fontSize: 13.6, color: C.textSecondary, marginTop: 8, fontWeight: '600', writingDirection: 'rtl', textAlign: 'center' },
  message: { fontFamily: 'Amiri', fontSize: 16, lineHeight: 32, color: C.textSecondary, textAlign: 'center', writingDirection: 'rtl', marginVertical: 20, paddingHorizontal: 8, zIndex: 1 },
  closeButton: { backgroundColor: C.accent, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 16, zIndex: 1 },
  closeButtonText: { fontFamily: 'Cairo', color: C.bg, fontSize: 16, fontWeight: '700', writingDirection: 'rtl', textAlign: 'center' },
});

// Static: Particle shape never changes with theme (color comes via props).
const particleStyles = StyleSheet.create({
  particle: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: 0 },
});

export default React.memo(CongratulationsModal);
