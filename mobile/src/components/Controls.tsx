import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  currentIdx: number;
  total: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
}

export default function Controls({ currentIdx, total, onFirst, onPrev, onNext, onLast }: Props) {
  const atStart = currentIdx === 0;
  const atEnd = currentIdx === total;

  return (
    <View style={styles.row}>
      <Btn label="⏮" onPress={onFirst} disabled={atStart} />
      <Btn label="◀" onPress={onPrev} disabled={atStart} />
      <Text style={styles.counter}>{currentIdx} / {total}</Text>
      <Btn label="▶" onPress={onNext} disabled={atEnd} />
      <Btn label="⏭" onPress={onLast} disabled={atEnd} />
    </View>
  );
}

function Btn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, disabled && styles.disabled]} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  btn: { width: 38, height: 38, backgroundColor: '#2d2d2d', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
  btnText: { fontSize: 16, color: '#e0e0e0' },
  counter: { minWidth: 56, textAlign: 'center', fontSize: 13, color: '#888' },
});
