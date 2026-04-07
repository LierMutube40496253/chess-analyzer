import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

interface Game {
  white: string;
  black: string;
  pgn: string;
  time_control: string;
  winner: string | null;
}

interface Props {
  onLoad: (pgn: string) => void;
}

export default function GameLoader({ onLoad }: Props) {
  const [username, setUsername] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setGames([]);
    try {
      const res = await axios.get(`${API_URL}/games/${username.trim()}`);
      if (res.data.length === 0) setError('No games found.');
      else setGames(res.data);
    } catch {
      setError('Could not fetch games. Check the username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Load from Chess.com</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="chess.com username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={fetchGames}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.btn} onPress={fetchGames} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator size="small" color="#81b64c" /> : <Text style={styles.btnText}>Fetch</Text>}
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {games.length > 0 && (
        <FlatList
          data={games}
          keyExtractor={(_, i) => String(i)}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gameItem}
              onPress={() => { onLoad(item.pgn); setGames([]); }}
              activeOpacity={0.8}
            >
              <Text style={styles.players}>
                {item.white} <Text style={styles.vs}>vs</Text> {item.black}
              </Text>
              <Text style={styles.meta}>
                {item.time_control} · {item.winner ? `${item.winner} won` : 'draw'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 12 },
  label: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e0e0e0',
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#81b64c', fontWeight: '700', fontSize: 14 },
  error: { color: '#ca3431', fontSize: 12, marginTop: 6 },
  list: { marginTop: 8, maxHeight: 200 },
  gameItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  players: { fontSize: 13, fontWeight: '600', color: '#e0e0e0' },
  vs: { color: '#666', fontWeight: '400' },
  meta: { fontSize: 11, color: '#888', marginTop: 2 },
});
