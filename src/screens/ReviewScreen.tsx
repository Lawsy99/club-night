// The post-game review. Every game, won or lost, ends here: Stockfish checks
// every move (with a progress bar), then the summary. The three biggest
// moments, best move and full-game view follow in later Phase 2 steps.
import { useEffect, useMemo, useState } from 'react'
import { analyseGame } from '../engine/reviewAnalysis'
import { describeOutcome, type Colour } from '../logic/game'
import { outcomeOf, type GameRecord } from '../logic/gameRecord'
import type { MoveRating } from '../logic/moveRating'
import { gameAccuracy, ratingCounts, reviewMoves, type PositionEval } from '../logic/review'
import { getArchivedGame, saveGameAnalysis } from '../storage/db'
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

  const outcome = outcomeOf(game)
  const reviewed = useMemo(() => (evals ? reviewMoves(game.moves, evals) : null), [evals, game.moves])
  const opponent: Colour = game.playerColour === 'w' ? 'b' : 'w'

  const resultLine = outcome
    ? outcome.winner === null
      ? 'Drawn — replayed next.'
      : outcome.winner === game.playerColour
        ? 'You won.'
        : 'You lost.'
    : ''

  return (
    <main className="review-screen">
      <header>
        <h1>Review</h1>
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
            <span className="accuracy-value">{gameAccuracy(reviewed, game.playerColour) ?? '–'}%</span>
            <span className="accuracy-label">your accuracy</span>
            <span className="accuracy-opponent">
              Opponent: {gameAccuracy(reviewed, opponent) ?? '–'}%
            </span>
          </div>

          <ul className="rating-counts">
            {RATING_ORDER.map((rating) => {
              const count = ratingCounts(reviewed, game.playerColour)[rating]
              return (
                <li key={rating} className={`rating-${rating}`}>
                  <span className="dot" />
                  <span className="count">{count}</span>
                  <span className="label">{COUNT_LABELS[rating][count === 1 ? 0 : 1]}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <button type="button" className="review-continue" onClick={onContinue}>
        {outcome?.winner === null ? 'Replay' : 'Continue'}
      </button>
    </main>
  )
}
