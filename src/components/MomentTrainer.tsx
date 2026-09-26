// "Find a better move": shows the position before a mistake and gives the
// player two tries, then reveals the engine's move. Used by the review, and
// later by the mistakes deck.
import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import { analysePosition } from '../engine/analysis'
import { flipScore, toCentipawns, winChance } from '../logic/evaluation'
import { explainBestMove, explainMistake } from '../logic/explain'
import { applyUci } from '../logic/game'
import type { Answer } from '../logic/mistakesDeck'
import type { Moment } from '../logic/moment'
import { Board } from './Board'
import { Portrait } from './Portrait'
import './MomentTrainer.css'

/**
 * How close to the engine's best an answer must be to count as right, in
 * winning chances: about 0.2 of a pawn in a level position (loosened Sep 2026:
 * sound alternatives like a natural defending move were being turned down).
 * Strict enough that an aimless move like a3 still doesn't pass.
 */
const ACCEPT_DROP = 0.05
/** Within this, a wrong answer is called "close": playable, not the best. */
const CLOSE_DROP = 0.12
/** Three tries: two plain, then a third with the piece to move highlighted. */
const TRIES = 3

type Result = 'solved' | 'revealed'

type Props = {
  moment: Moment
  /** Told how it went: solved first time, on the second try, or revealed. */
  onFinished?: (answer: Answer) => void
}

/** How long the position before the opponent's move shows, before they play it. */
const LEAD_UP_MS = 700
/** A pause on the question position before the answer is played out. */
const ANSWER_MS = 450

export function MomentTrainer({ moment, onFinished }: Props) {
  const [triesLeft, setTriesLeft] = useState(TRIES)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [result, setResult] = useState<{ kind: Result; fen: string; move: string } | null>(null)
  // Context (Joseph, Sep 2026): first the opponent's move that led here, then
  // the question; at the end, the answer is played out on the same board.
  const leadUp = moment.prevFen && moment.prevMove ? { fen: moment.prevFen, move: moment.prevMove } : null
  const question = {
    fen: moment.fenBefore,
    lastMove: leadUp ? { from: leadUp.move.slice(0, 2), to: leadUp.move.slice(2, 4) } : null,
  }
  const [shown, setShown] = useState(leadUp ? { fen: leadUp.fen, lastMove: null } : question)
  const [replaying, setReplaying] = useState(!!leadUp)
  useEffect(() => {
    if (!replaying) return
    const t = window.setTimeout(() => {
      setShown(question)
      setReplaying(false)
    }, LEAD_UP_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per replay
  }, [replaying])
  const showLeadUpAgain = () => {
    if (!leadUp) return
    setShown({ fen: leadUp.fen, lastMove: null })
    setReplaying(true)
  }

  const bestSan = sanOf(moment.fenBefore, moment.bestMove)

  function finish(kind: Result, fen: string, move: string) {
    // Play the answer out: the question position, then the piece moving.
    setShown(question)
    window.setTimeout(() => setShown({ fen, lastMove: { from: move.slice(0, 2), to: move.slice(2, 4) } }), ANSWER_MS)
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
    // Why the attempt falls short, if the board says (e.g. it leaves something loose).
    let whyNot = ''
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
      if (bestChance - attemptChance <= CLOSE_DROP) whyNot = ' Close: that’s playable, but there’s something stronger.'
      else if (analysis) {
        const reason = explainMistake({
          fenBefore: moment.fenBefore,
          played: uci,
          bestMove: null,
          reply: analysis.bestMove,
          cpBefore: moment.bestCp,
          cpAfter: toCentipawns(flipScore(analysis.score)),
        })
        if (!reason.startsWith('There was a stronger move')) whyNot = ` ${reason}`
      }
    } finally {
      setChecking(false)
    }

    const left = triesLeft - 1
    setTriesLeft(left)
    if (left <= 0) {
      const best = new Chess(moment.fenBefore)
      applyUci(best, moment.bestMove)
      finish('revealed', best.fen(), moment.bestMove)
    } else if (left === 1) {
      setFeedback(`Not quite.${whyNot} Last try: the piece to move is highlighted.`)
    } else {
      setFeedback(`Not quite.${whyNot} Try again.`)
    }
  }

  // The last try comes with a hint: which piece to move.
  const hintSquare = triesLeft === 1 ? moment.bestMove.slice(0, 2) : null

  const orientation = moment.playerColour === 'w' ? 'white' : 'black'

  const theirSan = leadUp ? sanOf(leadUp.fen, leadUp.move) : null
  // One board throughout, so each change of position is animated.
  const board = (
    <Board
      fen={shown.fen}
      orientation={orientation}
      movableColour={checking || replaying || result ? null : moment.playerColour}
      lastMove={shown.lastMove}
      onMove={handleAttempt}
      hintSquare={result ? null : hintSquare}
    />
  )

  if (result) {
    const solvedSan = result.kind === 'solved' ? sanOf(moment.fenBefore, result.move) : null
    return (
      <div className="moment">
        {board}
        <p className={`moment-verdict ${result.kind}`}>
          {result.kind === 'solved'
            ? solvedSan === bestSan
              ? `Yes: ${solvedSan}, the engine's choice.`
              : `Yes: ${solvedSan} works too. The engine's choice was ${bestSan}.`
            : `The best move was ${bestSan}.`}
        </p>
        {/* Pemberton explains both sides (Joseph, Sep 2026): why the best
            move works, and what went wrong with the move played. */}
        <div className="moment-coach">
          <Portrait who="pemberton" size={40} />
          <div>
            <p className="moment-coach-name">Coach Pemberton</p>
            <p className="moment-explanation">
              {explainBestMove(moment.fenBefore, moment.bestMove, moment.bestCp, moment.played)}
            </p>
            <p className="moment-explanation">
              And {moment.playedSan} in the game?{' '}
              {/* If the explanation is only about the move missed, don't say it twice. */}
              {/^You (missed|had)/.test(moment.explanation)
                ? moment.kind === 'missed'
                  ? 'It let their mistake go.'
                  : 'It let the chance go.'
                : moment.explanation}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="moment">
      {board}
      <p className="moment-prompt">
        {checking
          ? 'Checking…'
          : (feedback ??
            (moment.kind === 'missed'
              ? `${theirSan ? `They played ${theirSan}, and it was a mistake. ` : 'They’d just slipped up. '}In the game you played ${moment.playedSan}. Find the move that punishes it.`
              : `${theirSan ? `They played ${theirSan}. ` : ''}In the game you played ${moment.playedSan}. Find a better move.`))}
      </p>
      <p className="moment-tries">
        {triesLeft} {triesLeft === 1 ? 'try' : 'tries'} left
        {leadUp && !replaying && (
          <>
            {' · '}
            <button type="button" className="moment-replay" onClick={showLeadUpAgain}>
              See their move again
            </button>
          </>
        )}
      </p>
    </div>
  )
}

function sanOf(fen: string, uci: string): string {
  return applyUci(new Chess(fen), uci)?.san ?? uci
}
