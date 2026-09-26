// Plays a moment out with its context (Joseph, Sep 2026): the position
// before their move, their move, then yours. Used for "best move of the
// game", so you see what you were answering, not just where a piece landed.
import { useEffect, useMemo, useState } from 'react'
import { replay } from '../logic/game'
import { Board } from './Board'

type Props = {
  moves: readonly string[]
  /** The index of your move in `moves`. */
  ply: number
  orientation: 'white' | 'black'
}

const STEP_MS = 900

export function MoveReplay(props: Props) {
  // A fresh run each time ("Watch it again" starts from the beginning).
  const [run, setRun] = useState(0)
  return <Replay key={run} {...props} onAgain={() => setRun((r) => r + 1)} />
}

function Replay({ moves, ply, orientation, onAgain }: Props & { onAgain: () => void }) {
  // Frames: before their move (if there was one), after it, after yours.
  const frames = useMemo(() => {
    const start = Math.max(0, ply - 1)
    return Array.from({ length: ply + 2 - start }, (_, i) => {
      const upTo = start + i
      const last = upTo > 0 ? moves[upTo - 1] : null
      return { fen: replay(moves.slice(0, upTo)).fen(), last: last ? { from: last.slice(0, 2), to: last.slice(2, 4) } : null }
    })
  }, [moves, ply])
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const timers = frames.slice(1).map((_, i) => window.setTimeout(() => setShown(i + 1), STEP_MS * (i + 1)))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [frames])

  const frame = frames[shown]
  return (
    <>
      <Board fen={frame.fen} orientation={orientation} movableColour={null} lastMove={frame.last} onMove={() => {}} />
      {shown === frames.length - 1 && (
        <button type="button" className="review-secondary" onClick={onAgain}>
          Watch it again
        </button>
      )}
    </>
  )
}
