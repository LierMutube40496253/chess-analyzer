import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { CLASSIFICATION_COLOR, CLASSIFICATION_SYMBOL } from '../utils/chess';

interface Analysis {
  move: string;
  number: number;
  color: string;
  classification: string;
  explanation?: string;
}

interface Props {
  analyses: Analysis[];
  currentIdx: number;
  onSelect: (idx: number) => void;
}

export default function MoveList({ analyses, currentIdx, onSelect }: Props) {
  // Group into rows of [white, black]
  const rows: Array<{ number: number; white?: { posIdx: number; a: Analysis }; black?: { posIdx: number; a: Analysis } }> = [];
  for (let i = 0; i < analyses.length; i++) {
    const a = analyses[i];
    const posIdx = i + 1;
    if (a.color === 'white') {
      rows.push({ number: a.number, white: { posIdx, a } });
    } else {
      const last = rows[rows.length - 1];
      if (last && !last.black) last.black = { posIdx, a };
      else rows.push({ number: a.number, black: { posIdx, a } });
    }
  }

  const currentAnalysis = currentIdx > 0 ? analyses[currentIdx - 1] : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Move List</Text>

      {currentAnalysis?.explanation ? (
        <View style={styles.explanationBox}>
          <Text style={[styles.explanationText, { color: CLASSIFICATION_COLOR[currentAnalysis.classification] }]}>
            {CLASSIFICATION_SYMBOL[currentAnalysis.classification]} {currentAnalysis.move}
          </Text>
          <Text style={styles.explanationBody}>{currentAnalysis.explanation}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {rows.map((row) => (
          <View key={row.number} style={styles.row}>
            <Text style={styles.moveNum}>{row.number}.</Text>
            <MoveCell entry={row.white} currentIdx={currentIdx} onSelect={onSelect} />
            <MoveCell entry={row.black} currentIdx={currentIdx} onSelect={onSelect} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MoveCell({
  entry,
  currentIdx,
  onSelect,
}: {
  entry?: { posIdx: number; a: Analysis };
  currentIdx: number;
  onSelect: (idx: number) => void;
}) {
  if (!entry) return <View style={styles.cell} />;
  const { posIdx, a } = entry;
  const isActive = posIdx === currentIdx;
  const color = CLASSIFICATION_COLOR[a.classification];

  return (
    <TouchableOpacity
      style={[styles.cell, isActive && styles.activeCell]}
      onPress={() => onSelect(posIdx)}
      activeOpacity={0.7}
    >
      <Text style={styles.moveSan}>{a.move}</Text>
      <Text style={[styles.moveCls, { color }]}>{CLASSIFICATION_SYMBOL[a.classification]}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  explanationBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  explanationText: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  explanationBody: { fontSize: 12, color: '#ccc', lineHeight: 18 },
  list: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  moveNum: { width: 28, fontSize: 12, color: '#666', textAlign: 'right', paddingRight: 4 },
  cell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  activeCell: { backgroundColor: '#3a3a2a', borderWidth: 1, borderColor: '#81b64c' },
  moveSan: { fontSize: 13, color: '#e0e0e0', fontWeight: '500' },
  moveCls: { fontSize: 12, fontWeight: '700' },
});
