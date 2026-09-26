// The rating over time: one thin line, faint guide lines, the lowest and
// highest values labelled, and a touch/hover readout of any point.
import { useState } from 'react'
import type { RatingPoint } from '../logic/path'
import './RatingGraph.css'

const W = 340
const H = 150
const PAD = { top: 14, right: 12, bottom: 22, left: 40 }

export function RatingGraph({ points }: { points: readonly RatingPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  if (points.length < 2) {
    return <p className="graph-empty">The graph starts after your next rated game.</p>
  }
  const ratings = points.map((p) => p.rating)
  // A little room above and below, and never flatter than 100 points tall.
  const lo = Math.floor((Math.min(...ratings) - 10) / 50) * 50
  const hi = Math.max(lo + 100, Math.ceil((Math.max(...ratings) + 10) / 50) * 50)
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right)
  const y = (r: number) => PAD.top + (1 - (r - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(' ')
  const gridValues = [lo, (lo + hi) / 2, hi]
  const shown = active ?? points.length - 1

  function pick(clientX: number, rect: DOMRect) {
    const svgX = ((clientX - rect.left) / rect.width) * W
    const i = Math.round(((svgX - PAD.left) / (W - PAD.left - PAD.right)) * (points.length - 1))
    setActive(Math.max(0, Math.min(points.length - 1, i)))
  }

  return (
    <figure className="rating-graph">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Rating from ${ratings[0]} to ${ratings.at(-1)} over ${points.length - 1} rated games`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setActive(null)}
      >
        {gridValues.map((v) => (
          <g key={v}>
            <line className="graph-grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="graph-axis" x={PAD.left - 6} y={y(v) + 4} textAnchor="end">
              {Math.round(v)}
            </text>
          </g>
        ))}
        <path className="graph-line" d={path} />
        <line className="graph-cross" x1={x(shown)} x2={x(shown)} y1={PAD.top} y2={H - PAD.bottom} />
        <circle className="graph-dot" cx={x(shown)} cy={y(points[shown].rating)} r={4.5} />
        <text className="graph-axis" x={PAD.left} y={H - 4}>
          {formatDay(points[0].at)}
        </text>
        <text className="graph-axis" x={W - PAD.right} y={H - 4} textAnchor="end">
          {formatDay(points.at(-1)!.at)}
        </text>
      </svg>
      <figcaption>
        <strong>{points[shown].rating}</strong> {active === null ? 'now' : `on ${formatDay(points[shown].at)}`}
      </figcaption>
    </figure>
  )
}

function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
