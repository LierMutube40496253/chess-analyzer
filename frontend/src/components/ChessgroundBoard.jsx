import { useEffect, useRef, useState } from 'react'
import { Chessground } from 'chessground'
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'

/**
 * Chess.com visual logic:
 *
 * best       → green square highlight,      ★ badge,  NO arrow (you played the best)
 * good       → light-green highlight,        ✓ badge,  NO arrow
 * inaccuracy → yellow highlight,            ?! badge,  green arrow to best move
 * mistake    → orange highlight,             ? badge,  green arrow to best move
 * blunder    → red highlight,               ?? badge,  green arrow to best move
 */

const CLS = {
  best:       { squareColor: 'rgba(107, 201, 110, 0.55)', badge: { bg: '#6bc96e', symbol: '★',  fontSize: 22 } },
  good:       { squareColor: 'rgba(150, 188, 116, 0.55)', badge: { bg: '#96bc74', symbol: '✓',  fontSize: 22 } },
  inaccuracy: { squareColor: 'rgba(240, 197, 92,  0.55)', badge: { bg: '#f0c55c', symbol: '?!', fontSize: 16 }, showArrow: true },
  mistake:    { squareColor: 'rgba(229, 138, 37,  0.55)', badge: { bg: '#e58a25', symbol: '?',  fontSize: 22 }, showArrow: true },
  blunder:    { squareColor: 'rgba(202,  52, 49,  0.55)', badge: { bg: '#ca3431', symbol: '??', fontSize: 16 }, showArrow: true },
  brilliant:  { squareColor: 'rgba( 27, 173, 166, 0.55)', badge: { bg: '#1bada6', symbol: '!!', fontSize: 16 } },
}

function buildShapes(lastFrom, lastTo, bestFrom, bestTo, classification) {
  const shapes = []
  const cfg = CLS[classification]
  if (!cfg) return shapes

  // Colored square highlight on from and to squares of the played move
  const squareSvg = `<rect x="0" y="0" width="100" height="100" fill="${cfg.squareColor}"/>`
  if (lastFrom) shapes.push({ orig: lastFrom, customSvg: { html: squareSvg } })
  if (lastTo)   shapes.push({ orig: lastTo,   customSvg: { html: squareSvg } })

  // Classification badge — circle at bottom-right corner of destination square
  if (lastTo && cfg.badge) {
    const { bg, symbol, fontSize } = cfg.badge
    shapes.push({
      orig: lastTo,
      customSvg: {
        html: `
          <circle cx="80" cy="80" r="18" fill="${bg}" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/>
          <text x="80" y="${80 + fontSize * 0.38}"
                text-anchor="middle"
                font-size="${fontSize}"
                font-weight="900"
                font-family="'Segoe UI', Arial, sans-serif"
                fill="white">${symbol}</text>
        `,
      },
    })
  }

  // Green arrow to best move — only for inaccuracy / mistake / blunder
  if (cfg.showArrow && bestFrom && bestTo) {
    shapes.push({ orig: bestFrom, dest: bestTo, brush: 'green' })
  }

  return shapes
}

export default function ChessgroundBoard({
  fen, lastFrom, lastTo, bestFrom, bestTo, classification,
}) {
  const wrapperRef = useRef(null)
  const boardRef   = useRef(null)
  const cgRef      = useRef(null)
  const [size, setSize] = useState(0)

  useEffect(() => {
    if (!wrapperRef.current) return
    const w = wrapperRef.current.getBoundingClientRect().width
    setSize(Math.floor(w) || 520)
  }, [])

  // Mount Chessground once we know the pixel size
  useEffect(() => {
    if (!boardRef.current || size === 0) return

    cgRef.current = Chessground(boardRef.current, {
      fen,
      orientation: 'white',
      animation:   { enabled: true, duration: 300 },
      movable:     { free: false, color: undefined },
      draggable:   { enabled: false },
      selectable:  { enabled: false },
      lastMove:    lastFrom && lastTo ? [lastFrom, lastTo] : undefined,
      highlight:   { lastMove: false, check: false }, // we do our own highlight via shapes
      drawable: {
        enabled:      true,
        visible:      true,
        eraseOnClick: false,
        shapes:       buildShapes(lastFrom, lastTo, bestFrom, bestTo, classification),
        autoShapes:   [],
      },
    })

    return () => { cgRef.current?.destroy(); cgRef.current = null }
  }, [size]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update whenever props change
  useEffect(() => {
    if (!cgRef.current) return
    cgRef.current.set({
      fen,
      lastMove: lastFrom && lastTo ? [lastFrom, lastTo] : undefined,
      drawable: {
        shapes:     buildShapes(lastFrom, lastTo, bestFrom, bestTo, classification),
        autoShapes: [],
      },
    })
  }, [fen, lastFrom, lastTo, bestFrom, bestTo, classification]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrapperRef} style={{ width: '100%' }}>
      {size > 0 && (
        <div ref={boardRef} style={{ width: size, height: size }} />
      )}
    </div>
  )
}
