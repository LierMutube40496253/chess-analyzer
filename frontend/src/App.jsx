import { useState, useEffect } from 'react'
import axios from 'axios'
import { parsePGN, sanToSquares, CLASSIFICATION_COLOR } from './utils/chess'
import ChessgroundBoard from './components/ChessgroundBoard'
import EvalBar from './components/EvalBar'
import EvalGraph from './components/EvalGraph'
import CoachCard from './components/CoachCard'
import PlayerCard from './components/PlayerCard'
import Controls from './components/Controls'
import GameLoader from './components/GameLoader'

export default function App() {
  const [positions, setPositions] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [players, setPlayers] = useState({ white: 'White', black: 'Black' })

  const handleLoad = async (pgn) => {
    const parsed = parsePGN(pgn)
    if (!parsed) { setError('Invalid PGN.'); return }

    // Extract player names
    const w = pgn.match(/\[White "([^"]+)"\]/)
    const b = pgn.match(/\[Black "([^"]+)"\]/)
    setPlayers({ white: w?.[1] ?? 'White', black: b?.[1] ?? 'Black' })

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

  const currentPos   = positions?.[currentIdx]
  const currentFen   = currentPos?.fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const currentAnalysis = currentIdx > 0 ? analyses[currentIdx - 1] : null

  const bestSquares = currentAnalysis?.best_move && currentPos?.fen
    ? sanToSquares(currentPos.fen, currentAnalysis.best_move) : null

  const clsColor = currentAnalysis
    ? CLASSIFICATION_COLOR[currentAnalysis.classification] + '99'
    : undefined

  const whiteAccuracy = calcAccuracy(analyses, 'white')
  const blackAccuracy = calcAccuracy(analyses, 'black')

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">♟ Chess Analyzer</div>
        <div className="header-sub">Powered by Stockfish</div>
      </header>

      <div className="main">
        {/* ── LEFT: board ── */}
        <div className="board-section">
          <PlayerCard name={players.black} color="black" accuracy={blackAccuracy} />

          <div className="board-row">
            <EvalBar score={currentAnalysis?.score ?? 0} hasAnalysis={analyses.length > 0} />
            <div className="board-wrap">
              <ChessgroundBoard
                fen={currentFen}
                lastFrom={currentPos?.from}
                lastTo={currentPos?.to}
                bestFrom={bestSquares?.from}
                bestTo={bestSquares?.to}
                classification={currentAnalysis?.classification}
              />
            </div>
          </div>

          <PlayerCard name={players.white} color="white" accuracy={whiteAccuracy} />

          <Controls
            currentIdx={currentIdx}
            total={positions ? positions.length - 1 : 0}
            onFirst={() => setCurrentIdx(0)}
            onPrev={() => setCurrentIdx(i => Math.max(0, i - 1))}
            onNext={() => setCurrentIdx(i => Math.min((positions?.length ?? 1) - 1, i + 1))}
            onLast={() => setCurrentIdx((positions?.length ?? 1) - 1)}
          />

          {analyses.length > 0 && (
            <EvalGraph analyses={analyses} currentIdx={currentIdx} onSeek={setCurrentIdx} />
          )}
        </div>

        {/* ── RIGHT: analysis panel ── */}
        <div className="analysis-panel">
          <GameLoader onLoad={handleLoad} loading={loading} error={error} />

          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Analyzing with Stockfish + Gemini…</p>
            </div>
          )}

          {!loading && analyses.length === 0 && !positions && (
            <div className="empty-state">
              <span className="empty-icon">♟</span>
              <p>Enter a chess.com username and fetch a game to begin</p>
            </div>
          )}

          {analyses.length > 0 && (
            <CoachCard
              analysis={currentAnalysis}
              moveNumber={currentIdx}
              totalMoves={positions ? positions.length - 1 : 0}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function calcAccuracy(analyses, color) {
  const moves = analyses.filter(a => a.color === color)
  if (!moves.length) return null
  const scores = { best: 100, good: 85, inaccuracy: 60, mistake: 30, blunder: 0, brilliant: 100 }
  return Math.round(moves.reduce((s, a) => s + (scores[a.classification] ?? 70), 0) / moves.length)
}
