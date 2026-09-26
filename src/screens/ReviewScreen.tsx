// The post-game review. Every game, won or lost, ends here: Stockfish checks
// every move (with a progress bar), then a short sequence: summary, your
// biggest moments (find a better move), and the best move of the game.
import { useEffect, useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { FullGameView } from '../components/FullGameView'
import { MomentTrainer } from '../components/MomentTrainer'
import { analyseGame } from '../engine/reviewAnalysis'
import { explainGoodMove } from '../logic/explain'
import { describeOutcome, replay, type Colour } from '../logic/game'
import { outcomeOf, type GameRecord } from '../logic/gameRecord'
import { RATING_LABELS, type MoveRating } from '../logic/moveRating'
import { bestMoveOfGame, gameAccuracy, ratingCounts, reviewMoves, type PositionEval } from '../logic/review'
import { cardId, cardsFromMoments, gameMoments, moveLabel } from '../logic/mistakeCards'
import { addCardsIfNew, getArchivedGame, retireCardById, saveGameAnalysis } from '../storage/db'
import '../components/ratings.css'
import './ReviewScreen.css'

type Props = {
  game: GameRecord
  onContinue: () => void
  /** Opened from Past games: the way out goes back to the list. */
  fromHistory?: boolean
  /** For rated games: the player's rating before and after this result. */
  ratingChange?: { from: number; to: number } | null
}

/** Games shorter than this (in single moves) aren't graded. */
const SHORTEST_REVIEW = 8

const RATING_ORDER: MoveRating[] = ['best', 'good', 'inaccuracy', 'mistake', 'blunder']

const COUNT_LABELS: Record<MoveRating, [one: string, many: string]> = {
  best: ['Best move', 'Best moves'],
  good: ['Good move', 'Good moves'],
  inaccuracy: ['Inaccuracy', 'Inaccuracies'],
  mistake: ['Mistake', 'Mistakes'],
  blunder: ['Blunder', 'Blunders'],
}

export function ReviewScreen({ game, onContinue, fromHistory = false, ratingChange = null }: Props) {
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
    () => (evals ? gameMoments(game.moves, evals, player) : []),
    [evals, game.moves, player],
  )
  const best = useMemo(() => (reviewed ? bestMoveOfGame(reviewed, player) : null), [reviewed, player])

  // Real errors (mistakes and blunders) become Tuesday warm-ups. Done as soon
  // as the analysis is in, so they're kept even if the review is skipped.
  useEffect(() => {
    const cards = cardsFromMoments(game, moments)
    if (cards.length) addCardsIfNew(cards).catch((err) => console.error('Deck save failed', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per game's moments
  }, [moments, game.id])

  const resultLine = outcome
    ? outcome.winner === null
      ? fromHistory
        ? 'Drawn.'
        : 'Drawn: replayed next.'
      : outcome.winner === player
        ? 'You won.'
        : 'You lost.'
    : ''
  const finalLabel = fromHistory ? 'Back to past games' : outcome?.winner === null ? 'Replay' : 'Continue'

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
      {fromHistory ? 'Back' : 'Skip'}
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
            <span className={`review-pill rating-${moment.rating}`}>
              {moment.kind === 'missed' ? 'Missed chance' : RATING_LABELS[moment.rating]}
            </span>
          </h1>
        </header>
        <MomentTrainer
          key={step}
          moment={moment}
          onFinished={() => {
            setMomentDone(true)
            // Retried here, so it won't come back as a warm-up: warm-ups are
            // always a first look (Joseph, Sep 2026).
            retireCardById(cardId(game.id, moment.ply)).catch(() => undefined)
          }}
        />
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

  // A game over in a handful of moves (a resignation, a four-move mate) has
  // nothing worth grading: say so, rather than showing empty numbers.
  if (game.moves.length < SHORTEST_REVIEW) {
    return (
      <main className="review-screen">
        <header>
          <div className="review-topline">
            <h1>Review</h1>
          </div>
          <p className="review-result">
            {resultLine} {outcome && <span>{describeOutcome(outcome)}</span>}
          </p>
        </header>
        <p className="review-note">Too short to review: only {Math.ceil(game.moves.length / 2)} moves.</p>
        <button type="button" className="review-continue" onClick={onContinue}>
          {finalLabel}
        </button>
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
        {ratingChange && (
          <p className={`review-rating ${ratingChange.to >= ratingChange.from ? 'up' : 'down'}`}>
            Rating {Math.round(ratingChange.from)} → {Math.round(ratingChange.to)} (
            {ratingChange.to >= ratingChange.from ? '+' : '−'}
            {Math.abs(Math.round(ratingChange.to) - Math.round(ratingChange.from))})
          </p>
        )}
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

