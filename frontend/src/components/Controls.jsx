/**
 * Navigation controls — first / prev / next / last.
 * Also shows "use arrow keys" hint.
 */
export default function Controls({ currentIdx, total, onFirst, onPrev, onNext, onLast }) {
  return (
    <div className="controls">
      <button className="ctrl-btn" onClick={onFirst} disabled={currentIdx === 0} title="Start (↑)">⏮</button>
      <button className="ctrl-btn" onClick={onPrev}  disabled={currentIdx === 0} title="Prev (←)">◀</button>
      <span className="ctrl-counter">{currentIdx} / {total}</span>
      <button className="ctrl-btn" onClick={onNext}  disabled={currentIdx === total} title="Next (→)">▶</button>
      <button className="ctrl-btn" onClick={onLast}  disabled={currentIdx === total} title="End (↓)">⏭</button>
    </div>
  )
}
