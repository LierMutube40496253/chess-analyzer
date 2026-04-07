/**
 * Shows player name and accuracy percentage above/below the board.
 */
export default function PlayerCard({ name, color, accuracy }) {
  return (
    <div className={`player-card player-card--${color}`}>
      <div className="player-icon" style={{ background: color === 'white' ? '#eeeed2' : '#1a1a1a' }}>
        {color === 'white' ? '♔' : '♚'}
      </div>
      <span className="player-name">{name}</span>
      {accuracy !== null && (
        <span className="player-accuracy" title="Accuracy score">
          {accuracy}%
        </span>
      )}
    </div>
  )
}
