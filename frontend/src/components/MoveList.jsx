import { useEffect, useRef } from 'react'
import { CLASSIFICATION_COLOR, CLASSIFICATION_SYMBOL } from '../utils/chess'

export default function MoveList({ positions, analyses, currentIdx, onSelect }) {
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIdx])

  // Group into pairs per row
  const rows = []
  for (let i = 0; i < analyses.length; i++) {
    const a = analyses[i]
    const posIdx = i + 1
    if (a.color === 'white') {
      rows.push({ number: a.number, white: { posIdx, a }, black: null })
    } else {
      const last = rows[rows.length - 1]
      if (last && !last.black) last.black = { posIdx, a }
      else rows.push({ number: a.number, white: null, black: { posIdx, a } })
    }
  }

  // Summary counts
  const counts = {}
  for (const a of analyses) counts[a.classification] = (counts[a.classification] || 0) + 1

  // Current move explanation
  const currentAnalysis = currentIdx > 0 ? analyses[currentIdx - 1] : null

  return (
    <div className="move-list-wrap">
      <div className="section-label">Move List</div>

      {/* Classification summary */}
      <div className="classification-summary">
        {Object.entries(counts).map(([cls, n]) => (
          <span key={cls} className="cls-badge" style={{ borderColor: CLASSIFICATION_COLOR[cls] }} title={cls}>
            <span style={{ color: CLASSIFICATION_COLOR[cls] }}>{CLASSIFICATION_SYMBOL[cls]}</span> {n}
          </span>
        ))}
      </div>

      {/* Move rows */}
      <div className="move-list">
        {rows.map((row) => (
          <div key={row.number} className="move-row">
            <span className="move-num">{row.number}.</span>
            <MoveCell entry={row.white} currentIdx={currentIdx} onSelect={onSelect} activeRef={activeRef} />
            <MoveCell entry={row.black} currentIdx={currentIdx} onSelect={onSelect} activeRef={activeRef} />
          </div>
        ))}
      </div>

      {/* Explanation panel — shown when selected move has an explanation */}
      {currentAnalysis && (
        <div className="explanation-panel">
          <div className="explanation-header">
            <span
              className="explanation-move"
              style={{ color: CLASSIFICATION_COLOR[currentAnalysis.classification] }}
            >
              {CLASSIFICATION_SYMBOL[currentAnalysis.classification]} {currentAnalysis.move}
            </span>
            <span className="explanation-cls">{currentAnalysis.classification}</span>
          </div>
          {currentAnalysis.explanation ? (
            <p className="explanation-text">{currentAnalysis.explanation}</p>
          ) : (
            <p className="explanation-text explanation-text--muted">
              {currentAnalysis.classification === 'best'
                ? 'Best move — optimal choice in this position.'
                : currentAnalysis.classification === 'good'
                ? 'Good move — solid choice with no significant downside.'
                : 'No explanation available.'}
            </p>
          )}
          {currentAnalysis.best_move && currentAnalysis.best_move !== currentAnalysis.move && (
            <p className="explanation-best">Best was: <strong>{currentAnalysis.best_move}</strong></p>
          )}
        </div>
      )}
    </div>
  )
}

function MoveCell({ entry, currentIdx, onSelect, activeRef }) {
  if (!entry) return <span className="move-cell move-cell--empty" />
  const { posIdx, a } = entry
  const isActive = posIdx === currentIdx
  const color = CLASSIFICATION_COLOR[a.classification]
  const symbol = CLASSIFICATION_SYMBOL[a.classification]

  return (
    <button
      ref={isActive ? activeRef : null}
      className={`move-cell ${isActive ? 'move-cell--active' : ''}`}
      onClick={() => onSelect(posIdx)}
    >
      <span className="move-san">{a.move}</span>
      <span className="move-cls" style={{ color }}>{symbol}</span>
    </button>
  )
}
