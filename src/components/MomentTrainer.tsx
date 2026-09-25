// "Find a better move": shows the position before a mistake and gives the
// player two tries, then reveals the engine's move. Used by the review, and
// later by the mistakes deck.
import { Chess } from 'chess.js'
import { useState } from 'react'
import { analysePosition } from '../engine/analysis'
import { flipScore, winChance } from '../logic/evaluation'
import { applyUci, type Colour } from '../logic/game'
import { Board } from './Board'
import { HINT_ARROW_COLOUR } from './lineArrows'
import './MomentTrainer.css'

export type Moment = {
  fenBefore: string
  playerColour: Colour
  /** What the player actually played (UCI) and how it was written. */
  played: string
  playedSan: string
  bestMove: string
  /** The best available position value for the player, in centipawns. */
  bestCp: number
  explanation: string
}

/**
 * How close to the engine's best an answer must be to count as right, in
 * winning chances: about 0.1 of a pawn in a level position. Strict enough that
 * an aimless move like a3 doesn't pass, loose enough for real alternatives.
 */
const ACCEPT_DROP = 0.025
const TRIES = 2

type Result = 'solved' | 'revealed'

export function MomentTrainer({ moment, onFinished }: { moment: Moment; onFinished?: (r: Result) => void }) {
  const [triesLeft, setTriesLeft] = useState(TRIES)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [result, setResult] = useState<{ kind: Result; fen: string; move: string } | null>(null)

  const bestSan = sanOf(moment.fenBefore, moment.bestMove)

  function finish(kind: Result, fen: string, move: string) {
    setResult({ kind, fen, move })
    onFinished?.(kind)
  }

  async function handleAttempt(uci: string) {
    if (uci === moment.played) {
      setFeedback("That's what you played. Try something else.")
      return
    }
    const after = new Chess(moment.fenBefore)
    applyUci(after, uci)
    if (uci === moment.bestMove) return finish('solved', after.fen(), uci)

    setChecking(true)
    setFeedback(null)
    try {
      const analysis = await analysePosition(after.fen())
      // The attempt's value for the player (the analysis is from the opponent's side).
      const attemptChance = analysis
        ? winChance(flipScore(analysis.score))
        : after.isCheckmate()
          ? 1
          : 0.5
      const bestChance = winChance({ type: 'cp', value: moment.bestCp })
      if (bestChance - attemptChance <= ACCEPT_DROP) return finish('solved', after.fen(), uci)
    } finally {
      setChecking(false)
    }

    const left = triesLeft - 1
    setTriesLeft(left)
    if (left <= 0) {
      finish('revealed', moment.fenBefore, moment.bestMove)
    } else {
      setFeedback('Not quite. One more try.')
    }
  }

  const orientation = moment.playerColour === 'w' ? 'white' : 'black'

  if (result) {
    const solvedSan = result.kind === 'solved' ? sanOf(moment.fenBefore, result.move) : null
    return (
      <div className="moment">
        <Board
          fen={result.fen}
          orientation={orientation}
          movableColour={null}
          lastMove={result.kind === 'solved' ? { from: result.move.slice(0, 2), to: result.move.slice(2, 4) } : null}
          onMove={() => {}}
          arrows={
            result.kind === 'revealed'
              ? [{ from: moment.bestMove.slice(0, 2), to: moment.bestMove.slice(2, 4), colour: HINT_ARROW_COLOUR }]
              : []
          }
        />
        <p className={`moment-verdict ${result.kind}`}>
          {result.kind === 'solved'
            ? solvedSan === bestSan
              ? `Yes: ${solvedSan}, the engine's choice.`
              : `Yes: ${solvedSan} works too. The engine's choice was ${bestSan}.`
            : `The best move was ${bestSan}.`}
        </p>
        <p className="moment-explanation">
          You played {moment.playedSan}. {moment.explanation}
        </p>
      </div>
    )
  }

  return (
    <div className="moment">
      <Board
        fen={moment.fenBefore}
        orientation={orientation}
        movableColour={checking ? null : moment.playerColour}
        lastMove={null}
        onMove={handleAttempt}
      />
      <p className="moment-prompt">
        {checking
          ? 'Checking…'
          : (feedback ?? `You played ${moment.playedSan}. Find a better move.`)}
      </p>
      <p className="moment-tries">
        {triesLeft} {triesLeft === 1 ? 'try' : 'tries'} left
      </p>
    </div>
  )
}

function sanOf(fen: string, uci: string): string {
  return applyUci(new Chess(fen), uci)?.san ?? uci
}
