import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { scoreToPercent } from '../utils/chess'

/**
 * Evaluation graph across the game — white area above 50, black below.
 * Clicking a point seeks to that move.
 */
export default function EvalGraph({ analyses, currentIdx, onSeek }) {
  const data = analyses.map((a, i) => ({
    ply: i + 1,
    pct: parseFloat(scoreToPercent(a.score).toFixed(1)),
    label: `${a.number}. ${a.color === 'white' ? '' : '…'}${a.move}`,
  }))

  const handleClick = (payload) => {
    if (payload?.activePayload?.[0]) {
      onSeek(payload.activePayload[0].payload.ply)
    }
  }

  return (
    <div className="eval-graph">
      <p className="section-label">Evaluation</p>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} onClick={handleClick} style={{ cursor: 'pointer' }}>
          <defs>
            <linearGradient id="whiteGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eeeed2" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#eeeed2" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="blackGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="ply" hide />
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={50} stroke="#555" strokeDasharray="3 3" />
          {/* current move marker */}
          {currentIdx > 0 && (
            <ReferenceLine x={currentIdx} stroke="#81b64c" strokeWidth={2} />
          )}
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="graph-tooltip">
                  <span>{payload[0].payload.label}</span>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="pct"
            stroke="#81b64c"
            strokeWidth={1.5}
            fill="url(#whiteGrad)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
