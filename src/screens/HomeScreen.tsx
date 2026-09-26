// Home: one large "Next" card (design document, "The home screen"), the
// player's rating, and small links to the mistakes deck and past games.
// There is deliberately no free-play mode: the path decides what's next.
import { useEffect, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { NameField } from '../components/NameField'
import { Portrait } from '../components/Portrait'
import { LadderCard } from '../components/ClubLadder'
import { describeNews, type LadderNews, type Rung } from '../logic/ladder'
import type { Milestone } from '../logic/milestones'
import { cleanName } from '../logic/playerName'
import { ACT_1 } from '../data/act1'
import { findCharacter } from '../data/characters'
import { NOTICEBOARD } from '../data/noticeboard'
import { characterOpponentId } from '../data/opponents'
import { shownRating } from '../logic/glicko2'
import { dueCards } from '../logic/mistakesDeck'
import { wantsWarmup, type NextStep, type PathGame, type Progress } from '../logic/path'
import { WARMUP_CARDS } from '../logic/mistakesDeck'
import { TRIAL_LENGTH } from '../logic/trialNight'
import { headToHead, loadCards } from '../storage/db'
import './HomeScreen.css'

type Props = {
  progress: Progress
  next: NextStep
  /** The last rated game's rating change, shown once (e.g. 1245 → 1257). */
  lastChange: { from: number; to: number } | null
  /** Milestones reached in the game just finished (shown once). */
  milestones: Milestone[]
  /** The club ladder (null before the player has a rating), and who moved last game. */
  ladder: Rung[] | null
  ladderNews: LadderNews[]
  onOpenLadder: () => void
  onPlay: (game: PathGame) => void
  onStartLesson: () => void
  onTargetedPuzzles: () => void
  onOpenDeck: () => void
  onOpenHistory: () => void
  onOpenStats: () => void
  onOpenSettings: () => void
  /** For players who started before names were asked for. */
  onSetName: (name: string) => void
  /** A chapter's mistakes-deck warm-up: play it, or skip straight to the lesson. */
  onStartWarmup: () => void
  onSkipWarmup: () => void
  onSkipStep: () => void
  onReset: () => void
}

const KIND_LABELS: Record<PathGame['kind'], string> = {
  trial: 'Trial night',
  exhibition: 'Trial night',
  friendly: 'Friendly',
  match: 'Match',
  'cup-round': 'Knockout cup',
  boss: 'Cup final',
}

export function HomeScreen(props: Props) {
  const {
    progress,
    next,
    lastChange,
    milestones,
    ladder,
    ladderNews,
    onOpenLadder,
    onPlay,
    onStartLesson,
    onTargetedPuzzles,
    onOpenDeck,
    onOpenHistory,
    onOpenStats,
    onOpenSettings,
    onSetName,
    onStartWarmup,
    onSkipWarmup,
    onSkipStep,
    onReset,
  } = props
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

      {milestones.length + ladderNews.length > 0 && (
        <aside className="milestone-banner" role="status">
          {milestones.map((m) => (
            <p key={m.id}>{m.text}</p>
          ))}
          {ladderNews.map((n) => (
            <p key={`${n.kind}:${n.id}`}>{describeNews(n)}</p>
          ))}
        </aside>
      )}

      {!progress.playerName && <MissingName onSave={onSetName} />}

      <ActProgress progress={progress} />

      {wantsWarmup(progress, next, due ?? 0) ? (
        <WarmupCard due={due ?? 0} onStart={onStartWarmup} onSkip={onSkipWarmup} />
      ) : (
        <NextCard next={next} onPlay={onPlay} onStartLesson={onStartLesson} onTargetedPuzzles={onTargetedPuzzles} />
      )}

      {ladder && progress.stage !== 'trial' && <LadderCard ladder={ladder} news={ladderNews} onOpen={onOpenLadder} />}

      <Noticeboard progress={progress} next={next} />

      <nav className="home-links">
        <button type="button" onClick={onOpenDeck}>
          <strong>Mistakes deck</strong>
          <span>{due ? `${due} due` : 'Nothing due'}</span>
        </button>
        <button type="button" onClick={onOpenHistory}>
          <strong>Past games</strong>
          <span>Review any game</span>
        </button>
        <button type="button" onClick={onOpenStats}>
          <strong>Stats</strong>
          <span>Rating, record, openings</span>
        </button>
        <button type="button" onClick={onOpenSettings}>
          <strong>Settings</strong>
          <span>Chatter, backup</span>
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

/** A row of small circles: one per chapter's opponent, then the cup. */
function ActProgress({ progress }: { progress: Progress }) {
  if (progress.stage === 'trial' && progress.trial) {
    const played = progress.trial.games.length
    // The placement games, then Toby's.
    const total = TRIAL_LENGTH + 1
    return (
      <div className="act-progress" aria-label={`Trial night: game ${played + 1} of ${total}`}>
        <span className="act-label">Trial night</span>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`act-dot ${i < played ? 'done' : i === played ? 'current' : ''}`} />
        ))}
      </div>
    )
  }
  if (progress.stage !== 'act' && progress.stage !== 'act-complete') return null
  const chapters = ACT_1.chapters
  const inCup = progress.chapter >= chapters.length
  return (
    <div className="act-progress" aria-label={`Act 1, chapter ${Math.min(progress.chapter + 1, chapters.length)}`}>
      <span className="act-label">Act 1</span>
      {chapters.map((ch, i) => (
        <span
          key={ch.id}
          className={`act-dot lettered ${i < progress.chapter ? 'done' : i === progress.chapter ? 'current' : ''}`}
          title={findCharacter(ch.opponent)?.name}
        >
          {findCharacter(ch.opponent)?.name[0]}
        </span>
      ))}
      <span
        className={`act-dot lettered cup ${progress.stage === 'act-complete' ? 'done' : inCup ? 'current' : ''}`}
        title="Knockout cup"
      >
        {'★︎'}
      </span>
    </div>
  )
}

/** One line from a club member about what's coming up. */
function Noticeboard({ progress, next }: { progress: Progress; next: NextStep }) {
  const key =
    progress.stage === 'act-complete'
      ? 'complete'
      : progress.stage !== 'act'
        ? next.kind === 'play' && next.game.kind === 'exhibition'
          ? 'trial-finale'
          : (progress.trial?.games.length ?? 0) >= 2
            ? 'trial-honours'
            : 'trial'
        : progress.chapter < ACT_1.chapters.length
          ? ACT_1.chapters[progress.chapter].id
          : next.kind === 'play' && next.game.kind === 'boss'
            ? 'final'
            : 'cup'
  const notice = NOTICEBOARD[key]
  if (!notice) return null
  return (
    <aside className="noticeboard">
      <span className="noticeboard-pin" aria-hidden="true" />
      <p>
        “{notice.text}”<span className="noticeboard-by">{notice.speaker}</span>
      </p>
    </aside>
  )
}

/** Before a chapter's lesson: a few due cards from the mistakes deck. */
function WarmupCard({ due, onStart, onSkip }: { due: number; onStart: () => void; onSkip: () => void }) {
  const count = Math.min(due, WARMUP_CARDS)
  return (
    <section className="next-card">
      <p className="next-kind">Warm-up · before the lesson</p>
      <h2>
        {count} of your old mistakes
      </h2>
      <p className="next-opponent">
        <Portrait who="pemberton" size={44} />
        <span>
          <strong>Coach Pemberton</strong>{' '}
          <span className="next-rating">“A few from your own games first.”</span>
        </span>
      </p>
      <button type="button" className="next-play" onClick={onStart}>
        Start warm-up
      </button>
      <button type="button" className="next-secondary" onClick={onSkip}>
        Skip to the lesson
      </button>
    </section>
  )
}

/** Graham, catching up with someone who joined before names were asked for. */
function MissingName({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <section className="missing-name">
      <NameField value={name} onChange={setName} prompt="We never got your name for the membership list. Strictly speaking, that's irregular." />
      <button type="button" disabled={!cleanName(name)} onClick={() => onSave(cleanName(name))}>
        Sign the list
      </button>
    </section>
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
          <Portrait who="pemberton" size={44} />
          <span>
            <strong>Coach Pemberton</strong> <span className="next-rating">one example, then puzzles</span>
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
  return <PlayCard {...{ game, optionalFriendly, note, character, onPlay, onTargetedPuzzles, next }} />
}

function PlayCard({
  game,
  optionalFriendly,
  note,
  character,
  onPlay,
  onTargetedPuzzles,
  next,
}: {
  game: PathGame
  optionalFriendly: PathGame | null
  note: string | null
  character: ReturnType<typeof findCharacter>
  onPlay: (g: PathGame) => void
  onTargetedPuzzles: () => void
  next: Extract<NextStep, { kind: 'play' }>
}) {
  // Head-to-head so far against this opponent.
  const [record, setRecord] = useState<{ wins: number; losses: number } | null>(null)
  useEffect(() => {
    headToHead(characterOpponentId(game.opponent))
      .then((h) => setRecord({ wins: h.wins, losses: h.losses }))
      .catch(() => setRecord(null))
  }, [game.opponent])
  return (
    <section className="next-card">
      <p className="next-kind">
        {KIND_LABELS[game.kind]} · {game.location}
      </p>
      <h2>{game.label}</h2>
      <p className="next-opponent">
        <Portrait who={game.opponent} size={44} />
        <span>
          <strong>{character?.name ?? game.opponent}</strong>{' '}
          <span className="next-rating">{game.kind === 'exhibition' ? 'unrated' : game.rating}</span>
        </span>
        <span className="next-stage">{stageText(game.stage)}</span>
      </p>
      {record && record.wins + record.losses > 0 && (
        <p className="next-record">
          Your record against {character?.name ?? 'them'}: {record.wins} won, {record.losses} lost
        </p>
      )}
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
