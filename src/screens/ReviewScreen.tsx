// The post-game review. Every game, won or lost, ends here: Stockfish checks
// every move (with a progress bar), then a short sequence: summary, your
// biggest moments (find a better move), and the best move of the game.
import { useEffect, useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { FullGameView } from '../components/FullGameView'
import { MomentTrainer } from '../components/MomentTrainer'
import type { Moment } from '../logic/moment'
import { analyseGame } from '../engine/reviewAnalysis'
import { explainGoodMove, explainMistake } from '../logic/explain'
import { describeOutcome, replay, type Colour } from '../logic/game'
import { outcomeOf, type GameRecord } from '../logic/gameRecord'
import { RATING_GLYPHS, RATING_LABELS, type MoveRating } from '../logic/moveRating'
import {
  bestMoveOfGame,
  biggestMoments,
  gameAccuracy,
  ratingCounts,
  reviewMoves,
  type PositionEval,
  type ReviewedMove,
} from '../logic/review'
import { MAX_CARDS_PER_GAME, newCard, qualifiesForDeck } from '../logic/mistakesDeck'
import { addCardsIfNew, getArchivedGame, saveGameAnalysis } from '../storage/db'
import '../components/ratings.css'
import './ReviewScreen.css'

type Props = {
  game: GameRecord
  onContinue: () => void
}

const RATING_ORDER: MoveRating[] = ['best', 'good', 'inaccuracy', 'mistake', 'blunder']

const COUNT_LABELS: Record<MoveRating, [one: string, many: string]> = {
  best: ['Best move', 'Best moves'],
  good: ['Good move', 'Good moves'],
  inaccuracy: ['Inaccuracy', 'Inaccuracies'],
  mistake: ['Mistake', 'Mistakes'],
  blunder: ['Blunder', 'Blunders'],
}

export function ReviewScreen({ game, onContinue }: Props) {
  const [evals, setEvals] = useState<PositionEval[] | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: game.moves.length + 1 })
  const [failed, setFailed] = useState(false)
  // 0 = summary, 1…n = the moments, n + 1 = best move of the game
  const [step, setStep] = useState(0)
  const [momentDone, setMomentDone] = useState(false)
  const [fullGame, setFullGame] = useState(false)

  // Use saved analysis if this game was reviewed before; otherwise run it.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const saved = await getArchivedGame(game.id)
      if (saved?.evals?.length === game.moves.length + 1) {
        if (!cancelled) setEvals(saved.evals)
        return
      }
      const result = await analyseGame(
        game.moves,
        (done, total) => !cancelled && setProgress({ done, total }),
        () => cancelled,
      )
      if (!result || cancelled) return
      setEvals(result)
      await saveGameAnalysis(game.id, result)
    })().catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [game.id, game.moves])

  const player = game.playerColour
  const opponent: Colour = player === 'w' ? 'b' : 'w'
  const outcome = outcomeOf(game)
  const reviewed = useMemo(() => (evals ? reviewMoves(game.moves, evals) : null), [evals, game.moves])
  const moments = useMemo(
    () => (reviewed && evals ? biggestMoments(reviewed, player).map((m) => toMoment(m, evals, player)) : []),
    [reviewed, evals, player],
  )
  const best = useMemo(() => (reviewed ? bestMoveOfGame(reviewed, player) : null), [reviewed, player])

  // Real errors (mistakes and blunders) go into the mistakes deck. Done as
  // soon as the analysis is in, so they're kept even if the review is skipped.
  useEffect(() => {
    const cards = moments
      .filter((m) => qualifiesForDeck(m.rating))
      .slice(0, MAX_CARDS_PER_GAME)
      .map((m) => newCard(m, { gameId: game.id, ply: m.ply, rating: m.rating, moveLabel: m.moveLabel }))
    if (cards.length) addCardsIfNew(cards).catch((err) => console.error('Deck save failed', err))
  }, [moments, game.id])

  const resultLine = outcome
    ? outcome.winner === null
      ? 'Drawn — replayed next.'
      : outcome.winner === player
        ? 'You won.'
        : 'You lost.'
    : ''
  const finalLabel = outcome?.winner === null ? 'Replay' : 'Continue'

  function goTo(next: number) {
    setStep(next)
    setMomentDone(false)
    window.scrollTo({ top: 0 })
  }

  // --- The steps -----------------------------------------------------------

  if (fullGame && reviewed && evals) {
    return (
      <FullGameView
        moves={game.moves}
        evals={evals}
        reviewed={reviewed}
        playerColour={player}
        onBack={() => {
          setFullGame(false)
          window.scrollTo({ top: 0 })
        }}
      />
    )
  }

  const fullGameLink = (
    <button type="button" className="review-secondary" onClick={() => setFullGame(true)}>
      Step through the whole game
    </button>
  )

  // The review is optional (Joseph's decision, Sep 2026): skip straight on.
  const skipButton = (
    <button type="button" className="review-skip" onClick={onContinue}>
      Skip
    </button>
  )

  if (reviewed && step >= 1 && step <= moments.length) {
    const moment = moments[step - 1]
    return (
      <main className="review-screen with-board">
        <header>
          <div className="review-topline">
            <p className="review-kicker">
              Biggest moment {step} of {moments.length}
            </p>
            {skipButton}
          </div>
          <h1>
            {moment.moveLabel}{' '}
            <span className={`review-pill rating-${moment.rating}`}>{RATING_LABELS[moment.rating]}</span>
          </h1>
        </header>
        <MomentTrainer key={step} moment={moment} onFinished={() => setMomentDone(true)} />
        <button
          type="button"
          className="review-continue"
          disabled={!momentDone}
          onClick={() => goTo(step + 1)}
        >
          {step < moments.length ? 'Next moment' : 'Best move of the game'}
        </button>
      </main>
    )
  }

  if (reviewed && step === moments.length + 1) {
    return (
      <main className="review-screen with-board">
        <header>
          <p className="review-kicker">Best move of the game</p>
          {best && <h1>{moveLabel(best.move)}</h1>}
        </header>
        {best ? (
          <>
            <Board
              fen={replay(game.moves.slice(0, best.move.ply + 1)).fen()}
              orientation={player === 'w' ? 'white' : 'black'}
              movableColour={null}
              lastMove={{ from: best.move.uci.slice(0, 2), to: best.move.uci.slice(2, 4) }}
              onMove={() => {}}
            />
            <p className="review-explanation">
              {explainGoodMove(best.move.fenBefore, best.move.uci, best.punished)}
            </p>
          </>
        ) : (
          <p className="review-note">No standout move this time. Next game.</p>
        )}
        <button type="button" className="review-continue" onClick={onContinue}>
          {finalLabel}
        </button>
        {fullGameLink}
      </main>
    )
  }

  // Summary (and the progress bar while analysing).
  return (
    <main className="review-screen">
      <header>
        <div className="review-topline">
          <h1>Review</h1>
          {skipButton}
        </div>
        <p className="review-result">
          {resultLine} {outcome && <span>{describeOutcome(outcome)}</span>}
        </p>
      </header>

      {failed ? (
        <p className="review-note">The analysis couldn't run this time. Your game is still saved.</p>
      ) : !reviewed ? (
        <section className="review-progress" aria-live="polite">
          <p>Checking every move…</p>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
          <p className="review-note">
            {progress.done} of {progress.total} positions
          </p>
        </section>
      ) : (
        <section className="review-summary">
          <div className="accuracy">
            <span className="accuracy-value">{gameAccuracy(reviewed, player) ?? '–'}%</span>
            <span className="accuracy-label">your accuracy</span>
            <span className="accuracy-opponent">Opponent: {gameAccuracy(reviewed, opponent) ?? '–'}%</span>
          </div>

          <ul className="rating-counts">
            {RATING_ORDER.map((rating) => {
              const count = ratingCounts(reviewed, player)[rating]
              return (
                <li key={rating} className={`rating-${rating}`}>
                  <span className="dot" />
                  <span className="count">{count}</span>
                  <span className="label">{COUNT_LABELS[rating][count === 1 ? 0 : 1]}</span>
                </li>
              )
            })}
          </ul>

          {moments.length === 0 && <p className="review-note">No big mistakes this game.</p>}
        </section>
      )}

      {reviewed ? (
        <>
          <button type="button" className="review-continue" onClick={() => goTo(1)}>
            {moments.length > 0
              ? `Your biggest moment${moments.length === 1 ? '' : 's'} (${moments.length})`
              : 'Best move of the game'}
          </button>
          {fullGameLink}
        </>
      ) : (
        failed && (
          <button type="button" className="review-continue" onClick={onContinue}>
            {finalLabel}
          </button>
        )
      )}
    </main>
  )
}

type ReviewMoment = Moment & { ply: number; rating: MoveRating; moveLabel: string }

function toMoment(m: ReviewedMove, evals: readonly PositionEval[], player: Colour): ReviewMoment {
  const forPlayer = (cp: number) => (player === 'w' ? cp : -cp)
  const cpBefore = forPlayer(evals[m.ply].cp)
  const cpAfter = forPlayer(evals[m.ply + 1].cp)
  return {
    fenBefore: m.fenBefore,
    playerColour: player,
    played: m.uci,
    playedSan: m.san,
    bestMove: m.bestMove ?? m.uci,
    bestCp: cpBefore,
    explanation: explainMistake({
      fenBefore: m.fenBefore,
      played: m.uci,
      bestMove: m.bestMove,
      reply: evals[m.ply + 1].bestMove,
      cpBefore,
      cpAfter,
    }),
    ply: m.ply,
    rating: m.rating,
    moveLabel: moveLabel(m),
  }
}

/** "14. Bxf7??" or "14… Nf6", with the usual annotation mark. */
function moveLabel(m: ReviewedMove): string {
  const number = Math.floor(m.ply / 2) + 1
  const san = m.san + RATING_GLYPHS[m.rating]
  return m.mover === 'w' ? `${number}. ${san}` : `${number}… ${san}`
}
