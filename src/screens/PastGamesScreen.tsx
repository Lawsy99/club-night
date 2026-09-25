// Past games: every finished game, newest first. Tap one to review it again
// (the analysis is kept, so reviewed games open instantly).
import { useEffect, useState } from 'react'
import { HELP_STAGES } from '../data/helpStages'
import { findLevel } from '../data/testOpponents'
import { outcomeOf } from '../logic/gameRecord'
import { gameAccuracy, reviewMoves } from '../logic/review'
import { listArchivedGames, type ArchivedGame } from '../storage/db'
import './ReviewScreen.css'
import './PastGamesScreen.css'

type Props = {
  onOpen: (game: ArchivedGame) => void
  onBack: () => void
}

export function PastGamesScreen({ onOpen, onBack }: Props) {
  const [games, setGames] = useState<ArchivedGame[] | null>(null)

  useEffect(() => {
    listArchivedGames()
      .then(setGames)
      .catch(() => setGames([]))
  }, [])

  return (
    <main className="review-screen">
      <header className="review-topline">
        <h1>Past games</h1>
        <button type="button" className="review-skip" onClick={onBack}>
          Back
        </button>
      </header>

      {!games ? (
        <p className="review-note">Loading…</p>
      ) : games.length === 0 ? (
        <p className="review-note">No finished games yet.</p>
      ) : (
        <ul className="past-games">
          {games.map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => onOpen(g)}>
                <PastGameRow game={g} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function PastGameRow({ game }: { game: ArchivedGame }) {
  const level = findLevel(game.levelId)
  const outcome = safeOutcome(game)
  const result = !outcome ? '–' : outcome.winner === null ? 'Draw' : outcome.winner === game.playerColour ? 'Won' : 'Lost'
  const accuracy =
    game.evals?.length === game.moves.length + 1
      ? gameAccuracy(reviewMoves(game.moves, game.evals), game.playerColour)
      : null
  const date = new Date(game.finishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <>
      <span className={`past-result ${result.toLowerCase()}`}>{result}</span>
      <span className="past-main">
        <strong>
          vs {level.label} <span className="past-rating">{level.rating}</span>
        </strong>
        <span className="past-meta">
          {date} · {HELP_STAGES[game.stage]?.label ?? 'Real'} · {game.playerColour === 'w' ? 'White' : 'Black'} ·{' '}
          {Math.ceil(game.moves.length / 2)} moves
        </span>
      </span>
      <span className="past-accuracy">{accuracy !== null ? `${accuracy}%` : 'Not reviewed'}</span>
    </>
  )
}

/** Games saved by much older versions might not replay; show them without a result. */
function safeOutcome(game: ArchivedGame) {
  try {
    return outcomeOf(game)
  } catch {
    return null
  }
}
