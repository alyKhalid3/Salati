// src/components/Toggle.js — the mihrab switch.
// OFF: an ivory channel under a hairline with a quiet bead grounded at the
// right (RTL). ON: the channel fills mosque-green under a gold edge, and
// the bead slides to the left. No glow tricks; the color says it.
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { usePrayer } from '../context/PrayerContext';

const TRACK_W = 48;
const TRACK_H = 28;
const THUMB = 20;
const PADDING = 3;
const TRAVEL = TRACK_W - THUMB - PADDING * 2;

export default function Toggle({ value, onValueChange, accessibilityLabel }) {
  const { C, isDaytime } = usePrayer();
  const styles = React.useMemo(() => getStyles(C, isDaytime, value), [C, isDaytime, value]);
  const pos = useRef(new Animated.Value(value ? 1 : 0)).current;
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const anim = Animated.timing(pos, { toValue: value ? 1 : 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [value]);

  // Thumb measured from the START edge (left on screen). RTL: the OFF
  // state rests at the right edge (offset = +TRAVEL), ON at 0.
  const rtl = true;
  const tx = pos.interpolate({
    inputRange: [0, 1],
    outputRange: rtl ? [TRAVEL, 0] : [0, TRAVEL],
  });

  return (
    <View
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2 }]}
      onTouchEnd={(e) => {
        e.stopPropagation();
        onValueChange && onValueChange(!valueRef.current);
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.thumb, {
          position: 'absolute',
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          left: PADDING,
          top: (TRACK_H - THUMB) / 2,
          transform: [{ translateX: tx }],
        }]}
      />
    </View>
  );
}

const getStyles = (C, isDaytime, value) => StyleSheet.create({
  track: {
    backgroundColor: value ? (isDaytime ? C.green : C.greenLift) : C.bg,
    borderWidth: 1,
    borderColor: value ? C.accentGold : C.hairline,
  },
  thumb: {
    backgroundColor: value ? C.accentGold : C.textMuted,
    boxShadow: C.raiseSm,
  },
});
