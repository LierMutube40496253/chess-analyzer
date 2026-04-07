import { useState } from 'react'
import axios from 'axios'

/**
 * Fetches recent games for a chess.com username and lets the user
 * click one to load its PGN into the analyzer.
 */
export default function GameLoader({ onLoad }) {
  const [username, setUsername] = useState('')
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchGames = async () => {
    if (!username.trim()) return
    setLoading(true)
    setError(null)
    setGames([])
    try {
      const res = await axios.get(`/games/${username.trim()}`)
      if (res.data.length === 0) {
        setError('No games found for this username.')
      } else {
        setGames(res.data)
      }
    } catch {
      setError('Could not fetch games. Check the username.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="game-loader">
      <p className="section-label">Load from Chess.com</p>
      <div className="loader-row">
        <input
          className="loader-input"
          type="text"
          placeholder="chess.com username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchGames()}
        />
        <button className="loader-btn" onClick={fetchGames} disabled={loading}>
          {loading ? '…' : 'Fetch'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {games.length > 0 && (
        <ul className="game-list">
          {games.map((g, i) => (
            <li key={i}>
              <button
                className="game-item"
                onClick={() => { onLoad(g.pgn); setGames([]) }}
              >
                <span className="game-players">
                  {g.white} <span className="vs">vs</span> {g.black}
                </span>
                <span className="game-meta">
                  {g.time_control} · {g.winner ? `${g.winner} won` : 'draw'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
