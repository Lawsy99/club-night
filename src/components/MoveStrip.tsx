// The game's moves so far, as a single scrolling line under the board
// (like chess.com's move bar), always scrolled to the latest move.
import { useEffect, useRef } from 'react'
import './MoveStrip.css'

export function MoveStrip({ sans }: { sans: readonly string[] }) {
  const ref = useRef<HTMLOListElement>(null)
  useEffect(() => {
    // Scroll the strip itself sideways (not the page) to show the newest move.
    const el = ref.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [sans.length])

  if (sans.length === 0) {
    return <p className="move-strip empty">Tap a piece, then a square. Or drag.</p>
  }
  return (
    <ol className="move-strip" ref={ref} aria-label="Moves so far">
      {sans.map((san, i) => (
        <li key={i} className={i === sans.length - 1 ? 'latest' : undefined}>
          {i % 2 === 0 && <span className="num">{i / 2 + 1}.</span>}
          {san}
        </li>
      ))}
    </ol>
  )
}
