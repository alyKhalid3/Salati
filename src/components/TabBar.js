// src/components/TabBar.js — the four-page bottom bar.
// Ivory card with a gold hairline frame; the living page wears a green
// pill and gold ink. Icons are drawn strokes, never emojis. RTL first.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { usePrayer } from '../context/PrayerContext';
import { S } from '../utils/strings';
import { RADII, FONTS } from '../utils/theme';

function Icon({ name, color }) {
  const p = { stroke: color, strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'home') {
    // mihrab arch: dome + gold finial
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M4 21v-8a8 8 0 0 1 16 0v8" {...p} />
        <Circle cx={12} cy={4.6} r={1.5} fill={color} stroke="none" />
        <Path d="M12 21v-6.8a3.1 3.1 0 0 1 0 6.8z" {...p} />
      </Svg>
    );
  }
  if (name === 'times') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Circle cx={12} cy={13.4} r={7.2} {...p} />
        <Path d="M12 9.6v3.8l2.6 2.2" {...p} />
        <Path d="M9.4 3.6h5.2" {...p} />
      </Svg>
    );
  }
  if (name === 'progress') {
    // chain of days: three stacked steps
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Rect x={4.4} y={13.4} width={4} height={6.2} rx={1} fill={color} stroke="none" />
        <Rect x={10} y={9.6} width={4} height={10} rx={1} fill={color} stroke="none" opacity={0.66} />
        <Rect x={15.6} y={5.8} width={4} height={13.8} rx={1} fill={color} stroke="none" opacity={0.4} />
      </Svg>
    );
  }
  // settings gear
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} {...p} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...p} strokeWidth={1.5} />
    </Svg>
  );
}

export default function TabBar({ active, onChange, bottomInset = 10 }) {
  const { C } = usePrayer();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const PAGES = [
    { key: 'home', label: S.tabHome },
    { key: 'times', label: S.tabTimes },
    { key: 'progress', label: S.tabProgress },
    { key: 'settings', label: S.tabSettings },
  ];
  return (
    <View style={[styles.wrap, { paddingBottom: bottomInset }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {PAGES.map((p) => {
          const live = active === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              onPress={() => onChange && onChange(p.key)}
              style={[styles.item, live ? styles.itemLive : null]}
              accessibilityRole="tab"
              accessibilityState={{ selected: live }}
              accessibilityLabel={p.label}
            >
              <Icon name={p.key} color={live ? C.accentGold : C.textSecondary} />
              <Text style={[styles.label, live ? styles.labelLive : null]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (C) => StyleSheet.create({
  wrap: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  bar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.goldFaint,
    padding: 5,
    marginHorizontal: 16,
    direction: 'rtl',
    boxShadow: C.raise,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: 18,
  },
  itemLive: {
    backgroundColor: C.green,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10.4,
    fontWeight: '600',
    color: C.textSecondary,
    writingDirection: 'rtl',
  },
  labelLive: { color: C.onGreen, fontWeight: '700' },
});
