import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

import { parsePGN, sanToSquares, Position } from './src/utils/chess';
import { API_URL } from './src/config';
import ChessBoard from './src/components/ChessBoard';
import EvalBar from './src/components/EvalBar';
import EvalGraph from './src/components/EvalGraph';
import MoveList from './src/components/MoveList';
import PlayerCard from './src/components/PlayerCard';
import Controls from './src/components/Controls';
import GameLoader from './src/components/GameLoader';

interface MoveAnalysis {
  move: string;
  number: number;
  color: string;
  score: number;
  classification: string;
  best_move: string;
  explanation: string;
}

const ACCURACY_SCORES: Record<string, number> = {
  brilliant: 100, best: 100, good: 85, inaccuracy: 60, mistake: 30, blunder: 0,
};

function calcAccuracy(analyses: MoveAnalysis[], color: string): number | null {
  const moves = analyses.filter(a => a.color === color);
  if (!moves.length) return null;
  return Math.round(moves.reduce((s, a) => s + (ACCURACY_SCORES[a.classification] ?? 70), 0) / moves.length);
}

export default function App() {
  const [pgn, setPgn] = useState('');
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [analyses, setAnalyses] = useState<MoveAnalysis[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState({ white: 'White', black: 'Black' });
  const [showPgn, setShowPgn] = useState(true);

  useEffect(() => {
    const w = pgn.match(/\[White "([^"]+)"\]/);
    const b = pgn.match(/\[Black "([^"]+)"\]/);
    setPlayers({ white: w?.[1] ?? 'White', black: b?.[1] ?? 'Black' });
  }, [pgn]);

  const handleAnalyze = async () => {
    const parsed = parsePGN(pgn);
    if (!parsed) { setError('Invalid PGN.'); return; }
    setPositions(parsed);
    setCurrentIdx(0);
    setError(null);
    setAnalyses([]);
    setLoading(true);
    setShowPgn(false);
    try {
      const res = await axios.post(`${API_URL}/analyze`, { pgn });
      setAnalyses(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const currentPos = positions?.[currentIdx];
  const currentAnalysis = currentIdx > 0 ? analyses[currentIdx - 1] : null;

  const bestSquares = currentAnalysis?.best_move && currentPos?.fen
    ? sanToSquares(currentPos.fen, currentAnalysis.best_move) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>♟ Chess Analyzer</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* PGN / Loader section */}
          {showPgn || !positions ? (
            <View style={styles.card}>
              <GameLoader onLoad={p => { setPgn(p); setShowPgn(true); }} />
              <View style={styles.divider}><Text style={styles.dividerText}>or paste PGN</Text></View>
              <TextInput
                style={styles.pgnInput}
                value={pgn}
                onChangeText={setPgn}
                placeholder="Paste PGN here…"
                placeholderTextColor="#555"
                multiline
                numberOfLines={5}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading || !pgn.trim()} activeOpacity={0.8}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.analyzeBtnText}>Analyze Game</Text>}
              </TouchableOpacity>
              {error && <Text style={styles.error}>{error}</Text>}
            </View>
          ) : (
            <TouchableOpacity style={styles.newGameBtn} onPress={() => setShowPgn(true)} activeOpacity={0.8}>
              <Text style={styles.newGameText}>↩ New Game</Text>
            </TouchableOpacity>
          )}

          {/* Board section */}
          {positions && (
            <>
              <PlayerCard name={players.black} color="black" accuracy={calcAccuracy(analyses, 'black')} />

              <View style={styles.boardRow}>
                <EvalBar score={currentAnalysis?.score ?? 0} hasAnalysis={analyses.length > 0} />
                <ChessBoard
                  fen={currentPos?.fen ?? 'start'}
                  lastFrom={currentPos?.from}
                  lastTo={currentPos?.to}
                  classification={currentAnalysis?.classification}
                  bestFrom={bestSquares?.from}
                  bestTo={bestSquares?.to}
                />
              </View>

              <PlayerCard name={players.white} color="white" accuracy={calcAccuracy(analyses, 'white')} />
              <Controls
                currentIdx={currentIdx}
                total={positions.length - 1}
                onFirst={() => setCurrentIdx(0)}
                onPrev={() => setCurrentIdx(i => Math.max(0, i - 1))}
                onNext={() => setCurrentIdx(i => Math.min(positions!.length - 1, i + 1))}
                onLast={() => setCurrentIdx(positions!.length - 1)}
              />
            </>
          )}

          {/* Analysis section */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#81b64c" size="large" />
              <Text style={styles.loadingText}>Running Stockfish + Gemini…</Text>
            </View>
          )}

          {analyses.length > 0 && (
            <>
              <EvalGraph analyses={analyses} currentIdx={currentIdx} onSeek={setCurrentIdx} />
              <View style={styles.moveListWrap}>
                <MoveList analyses={analyses} currentIdx={currentIdx} onSelect={setCurrentIdx} />
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1e1e1e' },
  header: { backgroundColor: '#262421', borderBottomWidth: 1, borderBottomColor: '#333', paddingHorizontal: 16, paddingVertical: 12 },
  logo: { fontSize: 18, fontWeight: '700', color: '#81b64c' },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  card: { margin: 16, backgroundColor: '#262421', borderRadius: 12, padding: 16, gap: 12 },
  divider: { alignItems: 'center', paddingVertical: 4 },
  dividerText: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 },
  pgnInput: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 8,
    padding: 12, color: '#e0e0e0', fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 100, textAlignVertical: 'top',
  },
  analyzeBtn: {
    backgroundColor: '#81b64c', borderRadius: 8, padding: 14,
    alignItems: 'center',
  },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: '#ca3431', fontSize: 12 },

  newGameBtn: { margin: 16, marginBottom: 4, padding: 10, backgroundColor: '#262421', borderRadius: 8, alignItems: 'center' },
  newGameText: { color: '#81b64c', fontWeight: '600', fontSize: 14 },

  boardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 6 },

  loadingBox: { alignItems: 'center', padding: 32, gap: 12 },
  loadingText: { color: '#888', fontSize: 14 },

  moveListWrap: { minHeight: 300, marginTop: 12 },
});
