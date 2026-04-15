import { CLASSIFICATION_COLOR, CLASSIFICATION_SYMBOL } from '../utils/chess'

const CLS_LABEL = {
  brilliant:  'Brilliant Move',
  best:       'Best Move',
  good:       'Good Move',
  inaccuracy: 'Inaccuracy',
  mistake:    'Mistake',
  blunder:    'Blunder',
}

const CLS_ICON = {
  brilliant:  '!!',
  best:       '✓',
  good:       '✓',
  inaccuracy: '?!',
  mistake:    '?',
  blunder:    '??',
}

export default function CoachCard({ analysis, moveNumber, totalMoves }) {
  if (moveNumber === 0) {
    return (
      <div className="coach-card coach-card--start">
        <div className="coach-avatar">♟</div>
        <div className="coach-body">
          <p className="coach-title">Game loaded</p>
          <p className="coach-text">Press ▶ or → to step through the game. Each move will be evaluated by Stockfish and explained by Gemini.</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="coach-card">
        <div className="coach-body">
          <p className="coach-text muted">Navigating…</p>
        </div>
      </div>
    )
  }

  const color = CLASSIFICATION_COLOR[analysis.classification]
  const label = CLS_LABEL[analysis.classification]
  const icon  = CLS_ICON[analysis.classification]
  const scoreFmt = analysis.score >= 10000 ? '+M'
    : analysis.score <= -10000 ? '-M'
    : (analysis.score > 0 ? '+' : '') + analysis.score.toFixed(2)

  const showBest = analysis.best_move && analysis.best_move !== analysis.move

  return (
    <div className="coach-card" style={{ borderLeftColor: color }}>
      {/* Classification badge */}
      <div className="coach-badge" style={{ background: color }}>
        <span className="coach-badge-icon">{icon}</span>
        <span className="coach-badge-label">{label}</span>
      </div>

      {/* Move + score line */}
      <div className="coach-moveline">
        <span className="coach-move" style={{ color }}>{analysis.move}</span>
        <span className="coach-score" title="Stockfish evaluation (white's perspective)">
          {scoreFmt}
        </span>
      </div>

      {/* Best move hint */}
      {showBest && (
        <div className="coach-best">
          <span className="coach-best-label">Best was</span>
          <span className="coach-best-move">{analysis.best_move}</span>
        </div>
      )}

      {/* Coach explanation */}
      <div className="coach-explanation">
        {analysis.explanation
          ? <p className="coach-text">{analysis.explanation}</p>
          : <p className="coach-text muted">
              {analysis.classification === 'best'
                ? 'This was the engine\'s top choice. The move maximises your position and gives your opponent the fewest good options.'
                : analysis.classification === 'good'
                ? 'A solid move that keeps your position stable. There may have been a slightly stronger option, but this causes no significant problems.'
                : 'No detailed explanation available for this move.'}
            </p>
        }
      </div>

      {/* Move counter */}
      <div className="coach-footer">
        Move {moveNumber} of {totalMoves} · {analysis.color === 'white' ? '♔ White' : '♚ Black'}
      </div>
    </div>
  )
}
