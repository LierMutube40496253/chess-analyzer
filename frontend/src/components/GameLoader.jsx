import { useState } from 'react'
import api from '../api'

export default function GameLoader({ onLoad, loading, error }) {
  const [username, setUsername] = useState('')
  const [games, setGames] = useState([])
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const fetchGames = async () => {
    if (!username.trim()) return
    setFetching(true)
    setFetchError(null)
    setGames([])
    try {
      const res = await api.get(`/games/${username.trim()}`, { timeout: 60000 })
      if (res.data.length === 0) setFetchError('No games found for this username this month.')
      else setGames(res.data)
    } catch (e) {
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        setFetchError('Server is waking up (free tier sleeps). Wait 30s and try again.')
      } else if (e.response?.status === 404) {
        setFetchError('Username not found on chess.com.')
      } else {
        setFetchError(`Error: ${e.response?.data?.error || e.message || 'Could not reach server.'}`)
      }
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="game-loader">
      <p className="section-label">Chess.com Username</p>
      <div className="loader-row">
        <input
          className="loader-input"
          type="text"
          placeholder="Enter username…"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchGames()}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button className="loader-btn" onClick={fetchGames} disabled={fetching || loading}>
          {fetching ? '…' : 'Fetch'}
        </button>
      </div>

      {fetchError && <p className="error">{fetchError}</p>}
      {error && <p className="error">{error}</p>}

      {games.length > 0 && (
        <ul className="game-list">
          {games.map((g, i) => (
            <li key={i}>
              <button
                className="game-item"
                onClick={() => { onLoad(g.pgn); setGames([]) }}
                disabled={loading}
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
