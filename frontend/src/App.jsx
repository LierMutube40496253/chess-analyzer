import { useState, useEffect, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import axios from 'axios'
import { parsePGN, sanToSquares, CLASSIFICATION_COLOR } from './utils/chess'
import EvalBar from './components/EvalBar'
import EvalGraph from './components/EvalGraph'
import MoveList from './components/MoveList'
import PlayerCard from './components/PlayerCard'
import Controls from './components/Controls'
import GameLoader from './components/GameLoader'

const SAMPLE_PGN = `[Event "Live Chess"]
[White "PlayerOne"]
[Black "PlayerTwo"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 *`

export default function App() {
  const [pgn, setPgn] = useState(SAMPLE_PGN)
  const [positions, setPositions] = useState(null)   // parsed FEN array
  const [analyses, setAnalyses] = useState([])        // from backend
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [players, setPlayers] = useState({ white: 'White', black: 'Black' })

  // Extract player names from PGN headers
  useEffect(() => {
    const white = pgn.match(/\[White "([^"]+)"\]/)
    const black = pgn.match(/\[Black "([^"]+)"\]/)
    setPlayers({
      white: white ? white[1] : 'White',
      black: black ? black[1] : 'Black',
    })
  }, [pgn])

  const handleAnalyze = async () => {
    const parsed = parsePGN(pgn)
    if (!parsed) {
      setError('Invalid PGN. Please check your input.')
      return
    }
    setPositions(parsed)
    setCurrentIdx(0)
    setError(null)
    setAnalyses([])
    setLoading(true)
    try {
      const res = await axios.post('/analyze', { pgn })
      setAnalyses(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (!positions) return
      if (e.key === 'ArrowLeft')  setCurrentIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setCurrentIdx(i => Math.min(positions.length - 1, i + 1))
      if (e.key === 'ArrowUp')    setCurrentIdx(0)
      if (e.key === 'ArrowDown')  setCurrentIdx(positions.length - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [positions])

  const currentPos = positions?.[currentIdx]
  const currentFen = currentPos?.fen ?? 'start'

  // Current analysis entry (analyses[0] = move 1, aligned to positions[1])
  const currentAnalysis = currentIdx > 0 ? analyses[currentIdx - 1] : null

  // Best move arrow
  const arrows = (() => {
    if (!currentAnalysis?.best_move || !currentPos?.fen) return []
    const squares = sanToSquares(currentPos.fen, currentAnalysis.best_move)
    if (!squares) return []
    return [[squares.from, squares.to, '#6bc96e']]
  })()

  // Square highlight for the move just played
  const highlightSquares = (() => {
    if (!currentPos?.from) return {}
    const color = currentAnalysis
      ? CLASSIFICATION_COLOR[currentAnalysis.classification] + '88'
      : '#ffffff44'
    return {
      [currentPos.from]: { background: color },
      [currentPos.to]:   { background: color },
    }
  })()

  // Accuracy stats
  const whiteAccuracy = calcAccuracy(analyses, 'white')
  const blackAccuracy = calcAccuracy(analyses, 'black')

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">♟ Chess Analyzer</div>
        <div className="header-sub">Powered by Stockfish + Claude</div>
      </header>

      <div className="main">
        {/* ── LEFT: board section ── */}
        <div className="board-section">
          <PlayerCard
            name={players.black}
            color="black"
            accuracy={blackAccuracy}
          />

          <div className="board-row">
            <EvalBar
              score={currentAnalysis?.score ?? 0}
              hasAnalysis={analyses.length > 0}
            />
            <div className="board-wrap">
              <Chessboard
                position={currentFen}
                boardWidth={460}
                customArrows={arrows}
                customSquareStyles={highlightSquares}
                customDarkSquareStyle={{ backgroundColor: '#769656' }}
                customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                areArrowsAllowed={false}
                arePiecesDraggable={false}
              />
            </div>
          </div>

          <PlayerCard
            name={players.white}
            color="white"
            accuracy={whiteAccuracy}
          />

          <Controls
            currentIdx={currentIdx}
            total={positions ? positions.length - 1 : 0}
            onFirst={() => setCurrentIdx(0)}
            onPrev={() => setCurrentIdx(i => Math.max(0, i - 1))}
            onNext={() => setCurrentIdx(i => Math.min((positions?.length ?? 1) - 1, i + 1))}
            onLast={() => setCurrentIdx((positions?.length ?? 1) - 1)}
          />

          {analyses.length > 0 && (
            <EvalGraph
              analyses={analyses}
              currentIdx={currentIdx}
              onSeek={setCurrentIdx}
            />
          )}
        </div>

        {/* ── RIGHT: analysis panel ── */}
        <div className="analysis-panel">
          <GameLoader onLoad={pgn => setPgn(pgn)} />

          <div className="pgn-section">
            <label className="section-label">Paste PGN</label>
            <textarea
              className="pgn-input"
              value={pgn}
              onChange={e => setPgn(e.target.value)}
              rows={6}
              placeholder="Paste your PGN here..."
              spellCheck={false}
            />
            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? 'Analyzing…' : 'Analyze Game'}
            </button>
            {error && <p className="error">{error}</p>}
          </div>

          {analyses.length > 0 && (
            <MoveList
              positions={positions}
              analyses={analyses}
              currentIdx={currentIdx}
              onSelect={setCurrentIdx}
            />
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Running Stockfish + Claude…</p>
            </div>
          )}

          {analyses.length === 0 && !loading && (
            <div className="empty-state">
              <span className="empty-icon">♟</span>
              <p>Paste a PGN and click Analyze to see move-by-move feedback</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function calcAccuracy(analyses, color) {
  const moves = analyses.filter(a => a.color === color)
  if (!moves.length) return null
  const scores = {
    best: 100, good: 85, inaccuracy: 60, mistake: 30, blunder: 0, brilliant: 100,
  }
  const avg = moves.reduce((sum, a) => sum + (scores[a.classification] ?? 70), 0) / moves.length
  return Math.round(avg)
}
