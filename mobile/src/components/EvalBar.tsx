import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { scoreToPercent } from '../utils/chess';

const BOARD_SIZE = Dimensions.get('window').width - 56;

interface Props {
  score: number;
  hasAnalysis: boolean;
}

export default function EvalBar({ score, hasAnalysis }: Props) {
  if (!hasAnalysis) return <View style={styles.bar} />;

  const whitePct = scoreToPercent(score) / 100;
  const label = score >= 10000 ? 'M' : score <= -10000 ? '-M'
    : score >= 0 ? `+${Math.abs(score).toFixed(1)}` : `-${Math.abs(score).toFixed(1)}`;

  return (
    <View style={styles.bar}>
      {/* Black section (top) */}
      <View style={[styles.black, { flex: 1 - whitePct }]} />
      {/* White section (bottom) */}
      <View style={[styles.white, { flex: whitePct }]}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: 18,
    height: BOARD_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#333',
    flexDirection: 'column',
  },
  black: {
    backgroundColor: '#1a1a1a',
  },
  white: {
    backgroundColor: '#eeeed2',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  label: {
    fontSize: 8,
    color: '#555',
    fontWeight: '700',
    transform: [{ rotate: '-90deg' }],
  },
});
