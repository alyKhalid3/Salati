// src/components/WisdomCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

export default function WisdomCard({ message }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, [message]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4956a" strokeWidth="1.5">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </View>
        <Text style={styles.label}>حكمة اليوم</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <Text style={styles.text}>{message.text}</Text>
        <Text style={styles.source}>{message.source}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#4a4740',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    backgroundColor: '#d4956a',
  },
  text: {
    fontFamily: 'Amiri',
    fontSize: 16,
    lineHeight: 32,
    color: '#f0ece4',
    marginBottom: 8,
  },
  source: {
    fontSize: 11,
    color: '#4a4740',
    letterSpacing: 1,
  },
});
