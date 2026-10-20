// src/components/BootLoader.js - branded startup screen.
// "Salati" draws itself: copper outline, then a solid ivory fill sweeps
// left-to-right over ~3s. Nothing else competes with it.
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

const W = 260;
const H = 110;

function BootLoader() {
  const fillW = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Width can't ride the native driver — one boot-only animation,
    // so the cost is negligible.
    const draw = Animated.timing(fillW, { toValue: W, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: false });
    const sub = Animated.parallel([
      Animated.timing(subOpacity, { toValue: 1, duration: 600, delay: 2300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(subY, { toValue: 0, duration: 600, delay: 2300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]);
    draw.start();
    sub.start();
    return () => { draw.stop(); sub.stop(); };
  }, []);

  const textProps = {
    x: 130,
    y: 74,
    textAnchor: 'middle',
    fontFamily: 'Cairo',
    fontSize: 58,
    fontWeight: '700',
    letterSpacing: 4,
  };

  return (
    <View style={styles.root}>
      <View style={{ width: W, height: H, direction: 'ltr' }}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <SvgText {...textProps} fill="none" stroke="#d4956a" strokeWidth={1.1}>
            Salati
          </SvgText>
        </Svg>
        <Animated.View style={[styles.fillClip, { width: fillW }]}>
          <View style={{ width: W, height: H }}>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <SvgText {...textProps} fill="#f0ece4" stroke="none">
                Salati
              </SvgText>
            </Svg>
          </View>
        </Animated.View>
      </View>
      <Animated.View style={[styles.sub, { opacity: subOpacity, transform: [{ translateY: subY }] }]}>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerStar}>✦</Text>
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.tagline}>مواقيتك على وقتك</Text>
      </Animated.View>
      <Text style={styles.loading}>Preparing your times...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 },
  fillClip: { position: 'absolute', top: 0, left: 0, height: H, overflow: 'hidden' },
  sub: { alignItems: 'center', marginTop: 6 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, direction: 'ltr' },
  dividerLine: { width: 44, height: 1, backgroundColor: 'rgba(212, 149, 106, 0.30)' },
  dividerStar: { color: '#d4956a', fontSize: 11 },
  tagline: { fontFamily: 'Cairo', fontSize: 12.5, color: '#8a857a', textAlign: 'center', writingDirection: 'rtl', letterSpacing: 1 },
  loading: { position: 'absolute', bottom: 72, fontFamily: 'Cairo', fontSize: 10.5, color: '#4a4740', textAlign: 'center' },
});

export default React.memo(BootLoader);
