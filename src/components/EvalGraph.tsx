// The evaluation graph for the full-game view: one line, the player's
// winning chances after every move, with dots on their errors. Tap or drag
// anywhere on it to jump to that point of the game.
import { useRef } from 'react'
import type { MoveRating } from '../logic/moveRating'
import './EvalGraph.css'
import './ratings.css'

type Props = {
  /** Player's winning chances (0–1) at every position, start to finish. */
  points: number[]
  /** Player errors to mark: position index (after the move) and grade. */
  markers: { index: number; rating: MoveRating }[]
  current: number
  onSelect: (index: number) => void
}

// Drawn in a fixed coordinate space; the SVG scales to the screen width.
const W = 360
const H = 100
const PAD_X = 6
const PAD_Y = 8

/** Dot radius grows with severity, so size backs up the colour. */
const MARKER_R: Partial<Record<MoveRating, number>> = { inaccuracy: 4, mistake: 5, blunder: 6 }

export function EvalGraph({ points, markers, current, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const last = Math.max(points.length - 1, 1)
  const x = (i: number) => PAD_X + (i / last) * (W - PAD_X * 2)
  const y = (chance: number) => PAD_Y + (1 - chance) * (H - PAD_Y * 2)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - PAD_Y} L${x(0).toFixed(1)},${H - PAD_Y} Z`

  /** Nearest position to a finger/pointer position. */
  function select(clientX: number) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const fraction = ((clientX - rect.left) / rect.width) * W
    const index = Math.round(((fraction - PAD_X) / (W - PAD_X * 2)) * last)
    onSelect(Math.max(0, Math.min(points.length - 1, index)))
  }

  return (
    <figure className="eval-graph">
      <figcaption>
        Your winning chances <span>· higher is better for you · middle line is level</span>
      </figcaption>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Graph of your winning chances through the game. The move list below has the same information."
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          select(e.clientX)
        }}
        onPointerMove={(e) => dragging.current && select(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* 50% = level; hairline, solid, recessive */}
        <line className="graph-mid" x1={PAD_X} x2={W - PAD_X} y1={y(0.5)} y2={y(0.5)} />
        <path className="graph-area" d={area} />
        <path className="graph-line" d={line} />
        <line className="graph-cursor" x1={x(current)} x2={x(current)} y1={PAD_Y / 2} y2={H - PAD_Y / 2} />
        {markers.map((m) => (
          <circle
            key={m.index}
            className={`graph-marker rating-${m.rating}`}
            cx={x(m.index)}
            cy={y(points[m.index])}
            r={MARKER_R[m.rating] ?? 4}
          />
        ))}
        {/* A hollow ring, so an error dot underneath stays visible */}
        <circle className="graph-current" cx={x(current)} cy={y(points[current] ?? 0.5)} r={8} />
      </svg>
    </figure>
  )
}
