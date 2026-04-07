import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  name: string;
  color: 'white' | 'black';
  accuracy: number | null;
}

export default function PlayerCard({ name, color, accuracy }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: color === 'white' ? '#eeeed2' : '#1a1a1a', borderColor: '#555' }]}>
        <Text style={{ fontSize: 16 }}>{color === 'white' ? '♔' : '♚'}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      {accuracy !== null && (
        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyText}>{accuracy}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: '#e0e0e0' },
  accuracyBadge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  accuracyText: { fontSize: 12, fontWeight: '700', color: '#81b64c' },
});
