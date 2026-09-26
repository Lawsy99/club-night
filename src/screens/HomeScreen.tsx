// Home: one large "Next" card (design document, "The home screen"), the
// player's rating, and small links to the mistakes deck and past games.
// There is deliberately no free-play mode: the path decides what's next.
import { useEffect, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { findCharacter } from '../data/characters'
import { shownRating } from '../logic/glicko2'
import { dueCards } from '../logic/mistakesDeck'
import type { NextStep, PathGame, Progress } from '../logic/path'
import { loadCards } from '../storage/db'
import './HomeScreen.css'

type Props = {
  progress: Progress
  next: NextStep
  /** The last rated game's rating change, shown once (e.g. 1245 → 1257). */
  lastChange: { from: number; to: number } | null
  onPlay: (game: PathGame) => void
  onStartLesson: () => void
  onTargetedPuzzles: () => void
  onOpenDeck: () => void
  onOpenHistory: () => void
  onSkipStep: () => void
  onReset: () => void
}

const KIND_LABELS: Record<PathGame['kind'], string> = {
  trial: 'Trial night',
  friendly: 'Friendly',
  match: 'Match',
  'cup-round': 'Knockout cup',
  boss: 'Cup final',
}

export function HomeScreen(props: Props) {
  const { progress, next, lastChange, onPlay, onStartLesson, onTargetedPuzzles, onOpenDeck, onOpenHistory, onSkipStep, onReset } =
    props
  const [due, setDue] = useState<number | null>(null)

  useEffect(() => {
    loadCards()
      .then((cards) => setDue(dueCards(cards).length))
      .catch(() => setDue(null))
  }, [])

  return (
    <main className="home-screen">
      <header className="home-header">
        <div>
          <p className="home-kicker">Wexley Chess Club</p>
          <h1>Club Night</h1>
        </div>
        <div className="home-rating">
          {progress.rating ? (
            <>
              <strong>{shownRating(progress.rating)}</strong>
              <span>your rating</span>
            </>
          ) : (
            <span>Not rated yet</span>
          )}
        </div>
      </header>

      {lastChange && <RatingChange {...lastChange} />}

      <NextCard next={next} onPlay={onPlay} onStartLesson={onStartLesson} onTargetedPuzzles={onTargetedPuzzles} />

      <nav className="home-links">
        <button type="button" onClick={onOpenDeck}>
          <strong>Mistakes deck</strong>
          <span>{due ? `${due} due` : 'Nothing due'}</span>
        </button>
        <button type="button" onClick={onOpenHistory}>
          <strong>Past games</strong>
          <span>Review any game</span>
        </button>
      </nav>

      <details className="playtest">
        <summary>Playtest tools (temporary)</summary>
        <p>For testing the path quickly. Removed before the app is finished.</p>
        <button type="button" onClick={onSkipStep}>
          Skip this step (counts as a win)
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (window.confirm('Reset all progress, including your rating? Past games and the mistakes deck are kept.')) onReset()
          }}
        >
          Reset progress
        </button>
      </details>

      <p className="build-stamp">Version: {BUILD_LABEL}</p>
    </main>
  )
}

function RatingChange({ from, to }: { from: number; to: number }) {
  const diff = Math.round(to) - Math.round(from)
  return (
    <p className={`rating-change ${diff >= 0 ? 'up' : 'down'}`}>
      Rating {Math.round(from)} → {Math.round(to)} ({diff >= 0 ? '+' : '−'}
      {Math.abs(diff)})
    </p>
  )
}

function NextCard({
  next,
  onPlay,
  onStartLesson,
  onTargetedPuzzles,
}: Pick<Props, 'next' | 'onPlay' | 'onStartLesson' | 'onTargetedPuzzles'>) {
  if (next.kind === 'lesson') {
    return (
      <section className="next-card">
        <p className="next-kind">Lesson · {next.location}</p>
        <h2>{next.topic}</h2>
        <p className="next-opponent">
          <span className="next-portrait" aria-hidden="true">
            P
          </span>
          <span>
            <strong>Coach Pemberton</strong> <span className="next-rating">about two minutes, then puzzles</span>
          </span>
        </p>
        <button type="button" className="next-play" onClick={onStartLesson}>
          Start lesson
        </button>
      </section>
    )
  }
  if (next.kind === 'act-complete') {
    return (
      <section className="next-card">
        <p className="next-kind">Act 1 complete</p>
        <h2>You won the club knockout cup.</h2>
        <p className="next-note">Act 2, the club ladder, is still being written.</p>
      </section>
    )
  }
  if (next.kind !== 'play') return null

  const { game, optionalFriendly, note } = next
  const character = findCharacter(game.opponent)
  return (
    <section className="next-card">
      <p className="next-kind">
        {KIND_LABELS[game.kind]} · {game.location}
      </p>
      <h2>{game.label}</h2>
      <p className="next-opponent">
        <span className="next-portrait" aria-hidden="true">
          {character?.name[0] ?? '?'}
        </span>
        <span>
          <strong>{character?.name ?? game.opponent}</strong> <span className="next-rating">{game.rating}</span>
        </span>
        <span className="next-stage">{stageText(game.stage)}</span>
      </p>
      {note && <p className="next-note">{note}</p>}
      <button type="button" className="next-play" onClick={() => onPlay(game)}>
        Play
      </button>
      {optionalFriendly && (
        <button type="button" className="next-secondary" onClick={() => onPlay(optionalFriendly)}>
          {optionalFriendly.stage === 'assisted' ? 'Study him first: assisted friendly' : 'Play a friendly first'}
        </button>
      )}
      {next.targetedPuzzles && (
        <button type="button" className="next-secondary" onClick={onTargetedPuzzles}>
          {next.targetedPuzzles.title}
        </button>
      )}
    </section>
  )
}

function stageText(stage: PathGame['stage']): string {
  return stage === 'assisted' ? 'Assisted · help on' : stage === 'guided' ? 'Guided · light help' : 'No help'
}
