// "Find a better move": shows the position before a mistake and gives the
// player two tries, then reveals the engine's move. Used by the review, and
// later by the mistakes deck.
import { Chess } from 'chess.js'
import { useState } from 'react'
import { analysePosition } from '../engine/analysis'
import { flipScore, winChance } from '../logic/evaluation'
import { applyUci } from '../logic/game'
import type { Answer } from '../logic/mistakesDeck'
import type { Moment } from '../logic/moment'
import { Board } from './Board'
import { HINT_ARROW_COLOUR } from './lineArrows'
import './MomentTrainer.css'

/**
 * How close to the engine's best an answer must be to count as right, in
 * winning chances: about 0.1 of a pawn in a level position. Strict enough that
 * an aimless move like a3 doesn't pass, loose enough for real alternatives.
 */
const ACCEPT_DROP = 0.025
/** Three tries: two plain, then a third with the piece to move highlighted. */
const TRIES = 3

type Result = 'solved' | 'revealed'

type Props = {
  moment: Moment
  /** Told how it went: solved first time, on the second try, or revealed. */
  onFinished?: (answer: Answer) => void
}

export function MomentTrainer({ moment, onFinished }: Props) {
  const [triesLeft, setTriesLeft] = useState(TRIES)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [result, setResult] = useState<{ kind: Result; fen: string; move: string } | null>(null)

  const bestSan = sanOf(moment.fenBefore, moment.bestMove)

  function finish(kind: Result, fen: string, move: string) {
    setResult({ kind, fen, move })
    // For the mistakes deck: first try is a clean pass; later tries a harder one.
    onFinished?.(kind === 'revealed' ? 'revealed' : triesLeft === TRIES ? 'first-try' : 'second-try')
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
    } else if (left === 1) {
      setFeedback('Not quite. Last try: the piece to move is highlighted.')
    } else {
      setFeedback('Not quite. Try again.')
    }
  }

  // The last try comes with a hint: which piece to move.
  const hintSquare = triesLeft === 1 ? moment.bestMove.slice(0, 2) : null

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
        hintSquare={hintSquare}
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
