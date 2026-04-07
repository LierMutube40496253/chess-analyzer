import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Rect } from 'react-native-svg';
import { scoreToPercent } from '../utils/chess';

const WIDTH = Dimensions.get('window').width - 32;
const HEIGHT = 80;

interface MoveAnalysis {
  score: number;
  move: string;
  number: number;
  color: string;
}

interface Props {
  analyses: MoveAnalysis[];
  currentIdx: number;
  onSeek: (idx: number) => void;
}

export default function EvalGraph({ analyses, currentIdx, onSeek }: Props) {
  if (!analyses.length) return null;

  const pts = analyses.map((a, i) => ({
    x: (i / (analyses.length - 1 || 1)) * WIDTH,
    y: HEIGHT - (scoreToPercent(a.score) / 100) * HEIGHT,
  }));

  // Build SVG path
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${d} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  // Current position x
  const curX = currentIdx > 0
    ? ((currentIdx - 1) / (analyses.length - 1 || 1)) * WIDTH
    : 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Evaluation</Text>
      <View style={styles.graphWrap}>
        <Svg width={WIDTH} height={HEIGHT}>
          {/* Mid line */}
          <Line x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="#444" strokeWidth={1} strokeDasharray="4,4" />
          {/* Area fill */}
          <Path d={area} fill="#eeeed2" fillOpacity={0.15} />
          {/* Line */}
          <Path d={d} stroke="#81b64c" strokeWidth={2} fill="none" />
          {/* Current move marker */}
          {currentIdx > 0 && (
            <Line x1={curX} y1={0} x2={curX} y2={HEIGHT} stroke="#81b64c" strokeWidth={2} />
          )}
        </Svg>
        {/* Invisible touch targets per move */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          {analyses.map((_, i) => (
            <TouchableOpacity
              key={i}
              style={{ flex: 1 }}
              onPress={() => onSeek(i + 1)}
              activeOpacity={0.5}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  label: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  graphWrap: { position: 'relative', backgroundColor: '#1a1a1a', borderRadius: 6, overflow: 'hidden' },
});
