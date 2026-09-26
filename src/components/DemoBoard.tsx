// A board that teaches by itself, like a YouTube chess teacher: each step
// plays its moves one at a time with a plain-English caption. The player taps
// Next when ready (or Replay). Used by lessons and scouting reports.
import { Chess } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { applyUci } from '../logic/game'
import { Board, type BoardArrow } from './Board'
import './DemoBoard.css'

export type DemoStep = {
  caption: string
  /** Moves played during this step, in UCI (continuing from the step before). */
  moves: string[]
  /** An arrow to draw once the step's moves have played (e.g. "the reply"). */
  arrow?: BoardArrow
}

type Props = {
  startFen?: string
  steps: DemoStep[]
  orientation: 'white' | 'black'
  /** Shown on the last step's button. */
  finishLabel: string
  onFinish: () => void
  /** Who's talking, e.g. Coach Pemberton. */
  speaker?: string
}

const MOVE_MS = 900

/** Every position a demo passes through, step by step, move by move. */
function positions(startFen: string | undefined, steps: DemoStep[]) {
  const chess = new Chess(startFen)
  return steps.map((step) =>
    step.moves.map((uci) => {
      applyUci(chess, uci)
      return { fen: chess.fen(), last: { from: uci.slice(0, 2), to: uci.slice(2, 4) } }
    }),
  )
}

export function DemoBoard({ startFen, steps, orientation, finishLabel, onFinish, speaker = 'Coach Pemberton' }: Props) {
  const frames = useMemo(() => positions(startFen, steps), [startFen, steps])
  const initial = useMemo(() => new Chess(startFen).fen(), [startFen])
  const [step, setStep] = useState(0)
  const [played, setPlayed] = useState(0) // moves of this step shown so far
  const [run, setRun] = useState(0) // bumped to replay

  // Play this step's moves one at a time (`played` is reset by whoever changes the step).
  useEffect(() => {
    const total = steps[step].moves.length
    if (total === 0) return
    let n = 0
    const timer = window.setInterval(() => {
      n++
      setPlayed(n)
      if (n >= total) window.clearInterval(timer)
    }, MOVE_MS)
    return () => window.clearInterval(timer)
  }, [step, run, steps])

  // The position: the last move shown so far, else the end of the previous step.
  const current =
    played > 0 ? frames[step][played - 1] : step > 0 ? lastOf(frames, step - 1) : { fen: initial, last: null }
  const stepDone = played >= steps[step].moves.length
  const last = step === steps.length - 1

  return (
    <div className="demo">
      <Board
        fen={current?.fen ?? initial}
        orientation={orientation}
        movableColour={null}
        lastMove={current?.last ?? null}
        onMove={() => {}}
        arrows={stepDone && steps[step].arrow ? [steps[step].arrow] : []}
      />
      <div className="demo-caption">
        <span className="demo-portrait" aria-hidden="true">
          {/* Surname initial: "Coach Pemberton" → P (placeholder portrait) */}
          {speaker.split(' ').at(-1)?.[0]}
        </span>
        <div>
          <strong>{speaker}</strong>
          <p>{steps[step].caption}</p>
        </div>
      </div>
      <div className="demo-nav">
        <button
          type="button"
          onClick={() => {
            setPlayed(0)
            setRun((r) => r + 1)
          }}
        >
          Replay
        </button>
        <button
          type="button"
          className="primary"
          disabled={!stepDone}
          onClick={() => {
            if (last) return onFinish()
            setPlayed(0)
            setStep((s) => s + 1)
          }}
        >
          {last ? finishLabel : 'Next'}
        </button>
      </div>
    </div>
  )
}

/** The final position of a step (or of the nearest earlier step with moves). */
function lastOf(frames: { fen: string; last: { from: string; to: string } }[][], step: number) {
  for (let s = step; s >= 0; s--) if (frames[s].length) return frames[s][frames[s].length - 1]
  return null
}
