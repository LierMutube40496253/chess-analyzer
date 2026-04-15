import { Chess } from 'chess.js'

/**
 * Parse a PGN string into an array of positions.
 * Returns one entry per half-move (ply), plus the starting position.
 * Each entry: { fen, san, from, to, number, color }
 */
export function parsePGN(pgn) {
  const game = new Chess()
  try {
    game.loadPgn(pgn)
  } catch {
    return null
  }

  const history = game.history({ verbose: true })
  const positions = [{ fen: new Chess().fen(), san: null, from: null, to: null, number: 0, color: null }]

  const board = new Chess()
  for (const move of history) {
    board.move(move.san)
    positions.push({
      fen: board.fen(),
      san: move.san,
      from: move.from,
      to: move.to,
      number: move.color === 'w' ? Math.ceil(positions.length / 2) : Math.ceil(positions.length / 2),
      color: move.color === 'w' ? 'white' : 'black',
    })
  }
  return positions
}

/**
 * Convert a centipawn score to a 0-100 percentage (white's advantage).
 * Uses tanh so extreme scores don't dominate the bar.
 */
export function scoreToPercent(score) {
  if (score >= 10000) return 100
  if (score <= -10000) return 0
  return 50 + 50 * Math.tanh(score / 4)
}

/**
 * Given a FEN and a SAN move string, return { from, to } squares.
 */
export function sanToSquares(fen, san) {
  try {
    const chess = new Chess(fen)
    const move = chess.move(san)
    return move ? { from: move.from, to: move.to } : null
  } catch {
    return null
  }
}

export const CLASSIFICATION_COLOR = {
  brilliant: '#1bada6',
  best:      '#6bc96e',
  good:      '#96bc74',
  inaccuracy:'#f0c55c',
  mistake:   '#e58a25',
  blunder:   '#ca3431',
}

export const CLASSIFICATION_SYMBOL = {
  brilliant:  '!!',
  best:       '✓',
  good:       '·',
  inaccuracy: '?!',
  mistake:    '?',
  blunder:    '??',
}
