// A finishing drill: play a won ending out against the engine, which defends
// as well as it can (it's Stockfish at full strength, on the losing side).
import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import type { EndgamePosition } from '../data/endgameDrills'
import { getEngine } from '../engine/stockfish'
import { endgameAdvice, judgeEndgame, type DrillVerdict } from '../logic/endgameDrill'
import { applyUci, type Colour } from '../logic/game'
import { Board } from './Board'
import { Portrait } from './Portrait'
import './CoachDrill.css'

type Props = {
  position: EndgamePosition
  onDone: () => void
}

export function EndgameDrill({ position, onDone }: Props) {
  const you = new Chess(position.fen).turn() as Colour
  const [fen, setFen] = useState(position.fen)
  const [last, setLast] = useState<{ from: string; to: string } | null>(null)
  const [moves, setMoves] = useState(0)
  const [verdict, setVerdict] = useState<DrillVerdict>('going')
  const [thinking, setThinking] = useState(false)
  const [attempt, setAttempt] = useState(1)

  const restart = () => {
    setFen(position.fen)
    setLast(null)
    setMoves(0)
    setVerdict('going')
    setAttempt((a) => a + 1)
  }

  function play(uci: string) {
    const chess = new Chess(fen)
    const move = applyUci(chess, uci)
    if (!move) return
    const made = moves + 1
    setFen(chess.fen())
    setLast({ from: move.from, to: move.to })
    setMoves(made)
    // Your move may end it (mate, or stalemate by mistake); otherwise they reply
    // and it's judged then (a new queen has to survive their reply).
    if (chess.isGameOver()) return setVerdict(judgeEndgame(position, chess.fen(), you, made))
    setThinking(true)
  }

  // The defender's reply.
  useEffect(() => {
    if (!thinking) return
    let cancelled = false
    getEngine()
      .search(fen, { depth: 14, movetime: 700 })
      .then(({ bestMove }) => {
        if (cancelled) return
        const chess = new Chess(fen)
        const move = bestMove ? applyUci(chess, bestMove) : null
        if (move) {
          setFen(chess.fen())
          setLast({ from: move.from, to: move.to })
        }
        setVerdict(judgeEndgame(position, chess.fen(), you, moves))
      })
      .catch(() => setVerdict('going'))
      .finally(() => !cancelled && setThinking(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per move of yours
  }, [thinking])

  const over = verdict !== 'going'
  const message =
    verdict === 'won'
      ? position.success
      : over
        ? endgameAdvice(verdict)
        : moves === 0
          ? position.intro
          : `${position.maxMoves - moves} moves left.`

  return (
    <div className="coach-drill">
      <Board
        key={attempt}
        fen={fen}
        orientation={you === 'w' ? 'white' : 'black'}
        movableColour={over || thinking ? null : you}
        lastMove={last}
        onMove={play}
      />
      <div className="coach-drill-say">
        <Portrait who="pemberton" size={40} expression={verdict === 'won' ? 'pleased' : 'neutral'} />
        <p>{message}</p>
      </div>
      {over && verdict !== 'won' && (
        <button type="button" className="review-continue" onClick={restart}>
          Try again
        </button>
      )}
      {over && verdict === 'won' && (
        <button type="button" className="review-continue" onClick={onDone}>
          Carry on
        </button>
      )}
      {!over && (
        <button type="button" className="review-secondary" onClick={onDone}>
          Leave it for now
        </button>
      )}
    </div>
  )
}
