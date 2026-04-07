import { scoreToPercent } from '../utils/chess'

/**
 * Vertical evaluation bar — white grows from the bottom, black from the top.
 * Mimics the bar next to the board on chess.com.
 */
export default function EvalBar({ score, hasAnalysis }) {
  if (!hasAnalysis) return <div className="eval-bar eval-bar--empty" />

  const whitePct = scoreToPercent(score)
  const blackPct = 100 - whitePct

  const label = (() => {
    if (score >= 10000) return 'M'
    if (score <= -10000) return '-M'
    const abs = Math.abs(score).toFixed(1)
    return score >= 0 ? `+${abs}` : `-${abs}`
  })()

  return (
    <div className="eval-bar" title={label}>
      <div className="eval-bar__black" style={{ flex: blackPct }} />
      <div className="eval-bar__white" style={{ flex: whitePct }}>
        <span className="eval-bar__label">{label}</span>
      </div>
    </div>
  )
}
