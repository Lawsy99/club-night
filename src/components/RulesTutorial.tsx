// The moves, hands on, with Marjorie (for players who've never played). One
// task per piece; a wrong try gets a nudge and the position resets.
import { Chess } from 'chess.js'
import { useState } from 'react'
import { RULES_STEPS } from '../data/rulesTutorial'
import { applyUci } from '../logic/game'
import { Board } from './Board'
import { Portrait } from './Portrait'
import './CoachDrill.css'

type Props = {
  onDone: () => void
  onSkip: () => void
}

export function RulesTutorial({ onDone, onSkip }: Props) {
  const [index, setIndex] = useState(0)
  const [fen, setFen] = useState(RULES_STEPS[0].fen)
  const [last, setLast] = useState<{ from: string; to: string } | null>(null)
  const [message, setMessage] = useState(RULES_STEPS[0].say)
  const [solved, setSolved] = useState(false)
  const step = RULES_STEPS[index]

  function play(uci: string) {
    const chess = new Chess(fen)
    const move = applyUci(chess, uci)
    if (!move) return
    const right = step.target === 'mate' ? chess.isCheckmate() : move.to === step.target
    setFen(chess.fen())
    setLast({ from: move.from, to: move.to })
    if (right) {
      setSolved(true)
      setMessage(step.done)
    } else {
      setMessage(step.nudge)
      // Put it back so they can try again.
      window.setTimeout(() => {
        setFen(step.fen)
        setLast(null)
      }, 900)
    }
  }

  function next() {
    const n = index + 1
    if (n >= RULES_STEPS.length) return onDone()
    setIndex(n)
    setFen(RULES_STEPS[n].fen)
    setLast(null)
    setSolved(false)
    setMessage(RULES_STEPS[n].say)
  }

  return (
    <div className="coach-drill">
      <p className="coach-drill-progress">
        {step.title} · {index + 1} of {RULES_STEPS.length}
      </p>
      <Board fen={fen} orientation="white" movableColour={solved ? null : 'w'} lastMove={last} onMove={play} />
      <div className="coach-drill-say">
        <Portrait who="marjorie" size={40} expression={solved ? 'pleased' : 'neutral'} />
        <p>{message}</p>
      </div>
      {solved ? (
        <button type="button" className="rules-next" onClick={next}>
          {index + 1 < RULES_STEPS.length ? 'Next' : 'On to trial night'}
        </button>
      ) : (
        <button type="button" className="rules-skip" onClick={onSkip}>
          I know this bit: skip ahead
        </button>
      )}
    </div>
  )
}
