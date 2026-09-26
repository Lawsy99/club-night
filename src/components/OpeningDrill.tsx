// The opening drill: you play White, Pemberton plays Black and varies his
// replies. A move outside the line gets the principle it breaks; a second
// miss shows the move. Each right move gets its reason.
import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import type { OpeningDrill as Drill } from '../data/openingLessons'
import { applyUci, replay } from '../logic/game'
import { drillFinished, drillReply, expectedMoves, openingAdvice } from '../logic/openingDrill'
import { sanInWords } from '../logic/repertoire'
import { Board } from './Board'
import { HINT_ARROW_COLOUR } from './lineArrows'
import { Portrait } from './Portrait'
import './CoachDrill.css'

type Props = {
  drill: Drill
  onDone: () => void
}

export function OpeningDrill({ drill, onDone }: Props) {
  const [moves, setMoves] = useState<string[]>([])
  const [run, setRun] = useState(1)
  const [misses, setMisses] = useState(0)
  const [message, setMessage] = useState(`Play ${drill.name} as White. I’ll play Black.`)
  const [finished, setFinished] = useState(false)

  const chess = replay(moves)
  const fen = chess.fen()
  const last = chess.history({ verbose: true }).at(-1)
  const yourTurn = chess.turn() === 'w' && !finished
  const expected = expectedMoves(drill, moves)
  const lineOver = drillFinished(drill, moves)

  // His reply, after a moment.
  useEffect(() => {
    if (chess.turn() !== 'b' || lineOver) return
    const t = window.setTimeout(() => {
      const reply = drillReply(drill, moves)
      if (reply) setMoves((m) => [...m, reply])
    }, 600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per position
  }, [moves.length])

  // The end of a run-through.
  useEffect(() => {
    if (!lineOver || finished) return
    if (run >= drill.runs) {
      setFinished(true)
      setMessage(`That’s ${drill.name}. Play it in your games and it’ll become automatic.`)
    } else {
      setMessage('Good. Again, and I’ll answer differently this time.')
      const t = window.setTimeout(() => {
        setMoves([])
        setRun((r) => r + 1)
        setMisses(0)
      }, 1600)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when a line ends
  }, [lineOver])

  function play(uci: string) {
    if (expected.includes(uci)) {
      const san = applyUci(new Chess(fen), uci)?.san ?? ''
      setMessage(drill.why[san] ?? 'Good.')
      setMoves((m) => [...m, uci])
      setMisses(0)
      return
    }
    const expectedSan = expected[0] ? (applyUci(new Chess(fen), expected[0])?.san ?? null) : null
    const why = expectedSan ? (drill.why[expectedSan] ?? null) : null
    if (misses >= 1 && expectedSan) {
      setMessage(`Here: ${sanInWords(expectedSan)}. ${why ?? ''}`.trim())
    } else {
      setMessage(openingAdvice(fen, uci, moves, why))
    }
    setMisses((n) => n + 1)
  }

  const showMove = misses >= 2 && expected[0]
  return (
    <div className="coach-drill">
      <Board
        fen={fen}
        orientation="white"
        movableColour={yourTurn ? 'w' : null}
        lastMove={last ? { from: last.from, to: last.to } : null}
        onMove={play}
        arrows={showMove ? [{ from: expected[0].slice(0, 2), to: expected[0].slice(2, 4), colour: HINT_ARROW_COLOUR }] : []}
      />
      <div className="coach-drill-say">
        <Portrait who="pemberton" size={40} expression={finished ? 'pleased' : 'neutral'} />
        <p>{message}</p>
      </div>
      <p className="coach-drill-progress">
        Run-through {Math.min(run, drill.runs)} of {drill.runs}
      </p>
      {finished && (
        <button type="button" className="review-continue" onClick={onDone}>
          Carry on
        </button>
      )}
    </div>
  )
}
