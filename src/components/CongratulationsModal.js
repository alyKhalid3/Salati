// src/components/CongratulationsModal.js — the soft celebration.
// World: a raised slab pops over the dimmed ground; pastel beads (one per
// prayer window) fall softly; the tally presses up in Cairo. Animations
// preserved from the incumbent build.
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, BackHandler } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';
import { GLAZES } from '../utils/theme';
import { toArabicDigits } from '../utils/strings';

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

// Soft beads — one per prayer window, cycled.
const GLAZE_COLORS = [GLAZES.fajr.ink, GLAZES.dhuhr.ink, GLAZES.asr.ink, GLAZES.maghrib.ink, GLAZES.isha.ink, GLAZES.sunrise.ink];
const PARTICLES = [
  { left: '10%', color: GLAZE_COLORS[0], delay: 0, size: 10 },
  { left: '20%', color: GLAZE_COLORS[1], delay: 300, size: 6 },
  { left: '30%', color: GLAZE_COLORS[2], delay: 600, size: 8 },
  { left: '40%', color: GLAZE_COLORS[3], delay: 900, size: 10 },
  { left: '50%', color: GLAZE_COLORS[4], delay: 1200, size: 6 },
  { left: '60%', color: GLAZE_COLORS[5], delay: 200, size: 8 },
  { left: '70%', color: GLAZE_COLORS[3], delay: 500, size: 10 },
  { left: '80%', color: GLAZE_COLORS[1], delay: 800, size: 6 },
  { left: '90%', color: GLAZE_COLORS[0], delay: 1100, size: 8 },
];

function CongratulationsModal({ visible, dailyStreak, onClose }) {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const rotate = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const countScale = useRef(new Animated.Value(0.5)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;

  const message = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], [visible]);

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.92);
      rotate.setValue(0);
      iconBounce.setValue(0);
      countScale.setValue(0.5);
      countOpacity.setValue(0);
      return undefined;
    }
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onCloseRef.current();
      return true;
    });
    scale.setValue(0.92);
    rotate.setValue(0);
    countScale.setValue(0.5);
    countOpacity.setValue(0);
    const pop = Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(countScale, { toValue: 1, duration: 420, delay: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(countOpacity, { toValue: 1, duration: 420, delay: 120, useNativeDriver: true }),
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
    return () => { pop.stop(); bounce.stop(); glow.stop(); back.remove(); };
  }, [visible]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-3deg', '1.5deg', '0deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.host} pointerEvents="auto">
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
                    <Stop offset="0%" stopColor={C.accent} stopOpacity={0.30} />
                    <Stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={75} cy={75} r={75} fill="url(#congratsGlow)" />
              </Svg>
            </Animated.View>
            <Animated.View style={[styles.medallion, { transform: [{ translateY: iconBounce }] }]}>
              <Svg width={58} height={58} viewBox="0 0 24 24" fill="none" stroke={C.accentGold} strokeWidth={1.5}>
                <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </View>
          <Text style={styles.title}>ما شاء الله</Text>
          <Text style={styles.subtitle}>لقد أكملت جميع الصلوات اليوم</Text>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerGlaze} />
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.daysContainer}>
            <Animated.Text style={[styles.daysNumber, { opacity: countOpacity, transform: [{ scale: countScale }] }]}>{toArabicDigits(dailyStreak)}</Animated.Text>
            <Text style={styles.daysLabel}>أيام متتالية</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
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
      return undefined;
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
  host: { ...StyleSheet.absoluteFillObject, zIndex: 200, elevation: 200 },
  overlay: {
    flex: 1,
    backgroundColor: C.scrimStrong,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.goldFaint,
    paddingVertical: 30,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: 360,
    maxWidth: '92%',
    boxShadow: C.raise,
    overflow: 'visible',
  },
  particles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 16 },
  medallionWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 10, zIndex: 1 },
  medallionGlow: { position: 'absolute' },
  medallion: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.green,
    borderWidth: 1,
    borderColor: C.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14, zIndex: 1, direction: 'rtl' },
  dividerLine: { width: 56, height: 1, backgroundColor: C.goldFaint },
  dividerGlaze: { width: 7, height: 7, borderRadius: 1.5, backgroundColor: C.accentGold, transform: [{ rotate: '45deg' }] },
  title: {
    fontFamily: 'Cairo',
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
    zIndex: 1,
  },
  subtitle: { fontFamily: 'Cairo', fontSize: 14.6, color: C.textSecondary, marginBottom: 18, textAlign: 'center', writingDirection: 'rtl', zIndex: 1 },
  daysContainer: {
    alignItems: 'center',
    marginBottom: 4,
    zIndex: 1,
  },
  daysNumber: { fontFamily: 'Cairo', fontSize: 64, fontWeight: '700', color: C.accentGold, lineHeight: 74, textAlign: 'center' },
  daysLabel: { fontFamily: 'Cairo', fontSize: 13.2, color: C.textSecondary, marginTop: 4, fontWeight: '600', writingDirection: 'rtl', textAlign: 'center' },
  message: { fontFamily: 'Cairo', fontSize: 14.6, lineHeight: 30, color: C.textSecondary, textAlign: 'center', writingDirection: 'rtl', marginVertical: 18, paddingHorizontal: 8, zIndex: 1 },
  closeButton: { backgroundColor: C.green, borderWidth: 1, borderColor: C.accentGold, paddingHorizontal: 44, paddingVertical: 14, borderRadius: 14, zIndex: 1 },
  closeButtonText: { fontFamily: 'Cairo', color: C.onGreen, fontSize: 15.4, fontWeight: '700', writingDirection: 'rtl', textAlign: 'center' },
});

const particleStyles = StyleSheet.create({
  particle: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: 0 },
});

export default React.memo(CongratulationsModal);
