// src/components/WisdomCard.js — the verse slab.
// «المحراب» world: the Quran line rests on an ivory slab framed by a gold
// khatam rule, set in Amiri — the one face calligraphy belongs to.
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { usePrayer } from '../context/PrayerContext';
import OrnamentRule from '../components/OrnamentRule';
import { FONTS, RADII } from '../utils/theme';
import { toArabicDigits } from '../utils/strings';

function WisdomCard({ message }) {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, delay: 320, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 420, delay: 320, useNativeDriver: true }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [message]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}>
      <OrnamentRule width={230} />
      <View style={styles.slab}>
        <Text style={styles.verse}>﴿ {message.text} ﴾</Text>
        <Text style={styles.source}>{toArabicDigits(message.source)}</Text>
      </View>
      <OrnamentRule width={230} />
    </Animated.View>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 8,
    direction: 'rtl',
  },
  slab: {
    backgroundColor: C.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: C.goldFaint,
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginTop: 14,
    marginBottom: 14,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    boxShadow: C.raiseSm,
    direction: 'rtl',
  },
  verse: {
    fontFamily: FONTS.arabic,
    fontSize: 18,
    lineHeight: 36,
    color: C.text,
    textAlign: 'center',
  },
  source: {
    fontFamily: FONTS.sans,
    fontSize: 10.8,
    color: C.accentGold,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default React.memo(WisdomCard);
