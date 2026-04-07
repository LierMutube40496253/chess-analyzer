import { Chess } from 'chess.js';

export interface Position {
  fen: string;
  san: string | null;
  from: string | null;
  to: string | null;
  color: 'white' | 'black' | null;
  number: number;
}

export function parsePGN(pgn: string): Position[] | null {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    return null;
  }

  const history = game.history({ verbose: true });
  const positions: Position[] = [
    { fen: new Chess().fen(), san: null, from: null, to: null, color: null, number: 0 },
  ];

  const board = new Chess();
  for (const move of history) {
    board.move(move);
    positions.push({
      fen: board.fen(),
      san: move.san,
      from: move.from,
      to: move.to,
      color: move.color === 'w' ? 'white' : 'black',
      number: Math.ceil(positions.length / 2),
    });
  }
  return positions;
}

/** Convert centipawn score to 0–100 white-advantage percentage */
export function scoreToPercent(score: number): number {
  if (score >= 10000) return 100;
  if (score <= -10000) return 0;
  return 50 + 50 * Math.tanh(score / 4);
}

/** Given a FEN and SAN move, return { from, to } squares */
export function sanToSquares(fen: string, san: string): { from: string; to: string } | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move(san);
    return move ? { from: move.from, to: move.to } : null;
  } catch {
    return null;
  }
}

export const PIECE_UNICODE: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

export const CLASSIFICATION_COLOR: Record<string, string> = {
  brilliant:  '#1bada6',
  best:       '#6bc96e',
  good:       '#96bc74',
  inaccuracy: '#f0c55c',
  mistake:    '#e58a25',
  blunder:    '#ca3431',
};

export const CLASSIFICATION_SYMBOL: Record<string, string> = {
  brilliant:  '!!',
  best:       '✓',
  good:       '·',
  inaccuracy: '?!',
  mistake:    '?',
  blunder:    '??',
};
