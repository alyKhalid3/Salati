// src/components/WisdomCard.js - web .wisdom
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';

function WisdomCard({ message }) {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 700, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 600, delay: 700, useNativeDriver: true }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [message]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: translateAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={1.5}>
            <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <Path d="m9 12 2 2 4-4" />
          </Svg>
        </View>
        <Text style={styles.label}>حكمة اليوم</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <Text style={styles.ornament}>﴿</Text>
        <Text style={styles.text}>{message.text}</Text>
        <Text style={styles.ornament}>﴾</Text>
        <Text style={styles.source}>{message.source}</Text>
      </View>
    </Animated.View>
  );
}

const getStyles = (C) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: C.bg,
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    direction: 'rtl',
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Cairo',
    fontSize: 10.4,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: C.textMuted,
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 32,
    overflow: 'hidden',
    position: 'relative',
    direction: 'rtl',
    borderWidth: 1,
    borderColor: `rgba(${C.paper}, 0.06)`,
    borderTopColor: `rgba(${C.paper}, 0.13)`,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    height: '100%',
    backgroundColor: C.accent,
  },
  ornament: {
    fontFamily: 'Amiri',
    fontSize: 26,
    color: C.accent,
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 30,
    writingDirection: 'rtl',
  },
  text: {
    fontFamily: 'Amiri',
    fontSize: 17.6,
    lineHeight: 35.2,
    color: C.text,
    marginBottom: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  source: {
    fontFamily: 'Cairo',
    fontSize: 11.2,
    color: C.textMuted,
    letterSpacing: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

export default React.memo(WisdomCard);
