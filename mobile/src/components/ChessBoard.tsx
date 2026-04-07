import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Chess } from 'chess.js';
import { PIECE_UNICODE, CLASSIFICATION_COLOR } from '../utils/chess';

const BOARD_SIZE = Dimensions.get('window').width - 56; // leave room for eval bar + padding
const SQ = BOARD_SIZE / 8;

interface Props {
  fen: string;
  lastFrom?: string | null;
  lastTo?: string | null;
  classification?: string | null;
  bestFrom?: string | null;
  bestTo?: string | null;
}

export default function ChessBoard({ fen, lastFrom, lastTo, classification, bestFrom, bestTo }: Props) {
  const chess = new Chess(fen);
  const board = chess.board(); // rank8→rank1, file a→h

  const moveColor = classification ? CLASSIFICATION_COLOR[classification] + '99' : '#ffffff55';

  return (
    <View style={styles.board}>
      {board.map((rank, ri) =>
        rank.map((piece, fi) => {
          const sq = String.fromCharCode(97 + fi) + (8 - ri);
          const isLight = (ri + fi) % 2 === 0;
          const isLastMove = sq === lastFrom || sq === lastTo;
          const isBestMove = sq === bestFrom || sq === bestTo;

          return (
            <View
              key={sq}
              style={[
                styles.square,
                { backgroundColor: isLight ? '#eeeed2' : '#769656' },
                isLastMove && { backgroundColor: moveColor },
                isBestMove && styles.bestSquare,
              ]}
            >
              {piece && (
                <Text
                  style={[
                    styles.piece,
                    { color: piece.color === 'w' ? '#fff' : '#1a1a1a' },
                  ]}
                >
                  {PIECE_UNICODE[piece.color + piece.type]}
                </Text>
              )}
              {/* Rank label on left edge */}
              {fi === 0 && (
                <Text style={styles.rankLabel}>{8 - ri}</Text>
              )}
              {/* File label on bottom edge */}
              {ri === 7 && (
                <Text style={styles.fileLabel}>
                  {String.fromCharCode(97 + fi)}
                </Text>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 4,
    overflow: 'hidden',
  },
  square: {
    width: SQ,
    height: SQ,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestSquare: {
    backgroundColor: '#6bc96e88',
  },
  piece: {
    fontSize: SQ * 0.72,
    lineHeight: SQ * 0.85,
    textShadowColor: '#0004',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rankLabel: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 9,
    color: '#0006',
    fontWeight: '700',
  },
  fileLabel: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontSize: 9,
    color: '#0006',
    fontWeight: '700',
  },
});
