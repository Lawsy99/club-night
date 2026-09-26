// Home: one large "Next" card (design document, "The home screen"), the
// player's rating, and small links to the mistakes deck and past games.
// There is deliberately no free-play mode: the path decides what's next.
import { useEffect, useRef, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { NameField } from '../components/NameField'
import { Portrait } from '../components/Portrait'
import { LadderCard } from '../components/ClubLadder'
import { describeNews, type LadderNews, type Rung } from '../logic/ladder'
import type { Milestone } from '../logic/milestones'
import { cleanName } from '../logic/playerName'
import { TRIAL_NOTE } from '../data/act1'
import { findCharacter } from '../data/characters'
import { characterOpponentId } from '../data/opponents'
import { shownRating } from '../logic/glicko2'
import { warmupCards } from '../logic/mistakesDeck'
import { wantsWarmup, type NextStep, type PathGame, type Progress } from '../logic/path'
import { TRIAL_LENGTH } from '../logic/trialNight'
import { clubWeek } from '../logic/clubWeek'
import { sessionLabel } from '../data/clubWeek'
import { warmupLine } from '../data/warmupLines'
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
  /** The club calendar (tap this week's heading). */
  onOpenCalendar: () => void
  onPlay: (game: PathGame) => void
  onStartLesson: () => void
  onTargetedPuzzles: () => void
  onOpenHistory: () => void
  onOpenStats: () => void
  onOpenSettings: () => void
  /** For players who started before names were asked for. */
  onSetName: (name: string) => void
  /** Coaching night's warm-ups (past errors), before the lesson. */
  onStartWarmup: () => void
  onSkipStep: () => void
  onReset: () => void
}

/** Remembers (on this phone only) that the playtest tools are switched on. */
const PLAYTEST_KEY = 'club-night-playtest'

function readPlaytest(): boolean {
  try {
    return localStorage.getItem(PLAYTEST_KEY) === 'on'
  } catch {
    return false
  }
}

const KIND_LABELS: Record<PathGame['kind'], string> = {
  trial: 'Trial night',
  exhibition: 'Trial night',
  coaching: 'Coaching night',
  friendly: 'Practice night',
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
    onOpenCalendar,
    onPlay,
    onStartLesson,
    onTargetedPuzzles,
    onOpenHistory,
    onOpenStats,
    onOpenSettings,
    onSetName,
    onStartWarmup,
    onSkipStep,
    onReset,
  } = props
  // Past errors waiting to be put right (the coach's warm-ups on Tuesday).
  const [waiting, setWaiting] = useState(0)
  const [playtestOn, setPlaytestOn] = useState(readPlaytest)
  const stampTaps = useRef(0)
  const setPlaytest = (on: boolean) => {
    setPlaytestOn(on)
    try {
      if (on) localStorage.setItem(PLAYTEST_KEY, 'on')
      else localStorage.removeItem(PLAYTEST_KEY)
    } catch {
      // Storage blocked: the tools just won't be remembered.
    }
  }
  const tapStamp = () => {
    stampTaps.current += 1
    if (stampTaps.current >= 5) setPlaytest(true)
  }

  useEffect(() => {
    loadCards()
      .then((cards) => setWaiting(warmupCards(cards).length))
      .catch(() => setWaiting(0))
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

      <button type="button" className="act-progress-button" onClick={onOpenCalendar} aria-label="Club calendar">
        <ActProgress progress={progress} />
      </button>

      {wantsWarmup(progress, next, waiting) ? (
        <WarmupCard count={waiting} week={progress.chapter} onStart={onStartWarmup} />
      ) : (
        <NextCard next={next} onPlay={onPlay} onStartLesson={onStartLesson} onTargetedPuzzles={onTargetedPuzzles} />
      )}

      {ladder && progress.stage !== 'trial' && <LadderCard ladder={ladder} news={ladderNews} onOpen={onOpenLadder} />}


      <nav className="home-links">
        <button type="button" onClick={onOpenHistory}>
          <strong>Past games</strong>
          <span>Review any</span>
        </button>
        <button type="button" onClick={onOpenStats}>
          <strong>Stats</strong>
          <span>Your record</span>
        </button>
        <button type="button" onClick={onOpenSettings}>
          <strong>Settings</strong>
          <span>Board, backup</span>
        </button>
      </nav>

      {/* Playtest tools: switched on by tapping the version line five times,
          and they stay on (on this phone) until hidden again. */}
      {playtestOn && (
        <details className="playtest" open>
          <summary>Playtest tools</summary>
          <p>For testing the path quickly.</p>
          <button type="button" onClick={onSkipStep}>
            Skip this step (counts as a win)
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (
                window.confirm(
                  'Start again from the beginning? This clears your rating, the story, past games and your records with everyone. Settings are kept.',
                )
              )
                onReset()
            }}
          >
            Reset progress
          </button>
          <button type="button" onClick={() => setPlaytest(false)}>
            Hide playtest tools
          </button>
        </details>
      )}

      <button type="button" className="build-stamp" onClick={tapStamp}>
        Version: {BUILD_LABEL}
      </button>
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
      <div className="club-week">
        <div className="act-progress" aria-label={`Trial night: game ${played + 1} of ${total}`}>
          <span className="act-label">Trial night</span>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`act-dot ${i < played ? 'done' : i === played ? 'current' : ''}`} />
          ))}
        </div>
        {played >= 2 && <p className="club-week-note">{TRIAL_NOTE}</p>}
      </div>
    )
  }
  // The club week: a small calendar of this week's sessions (Joseph, Sep 2026).
  // No act numbers on screen: it plays as one continuous story.
  const week = clubWeek(progress)
  if (!week) return null
  return (
    <div className="club-week">
      <p className="club-week-head">
        <strong>{week.title}</strong> <span>{week.subtitle} ›</span>
      </p>
      <ol className="club-week-days">
        {week.slots.map((s) => (
          <li key={s.key} className={`club-week-day ${s.state}`}>
            {s.day && <span className="club-week-dow">{s.day}</span>}
            <span className="club-week-name">{s.name}</span>
            {s.state === 'done' && (
              <span className="club-week-tick" aria-label="done">
                ✓︎
              </span>
            )}
            {s.state === 'today' && <span className="club-week-tonight">tonight</span>}
          </li>
        ))}
      </ol>
      {/* One line of what else is going on at the club this week. */}
      {week.note && <p className="club-week-note">{week.note}</p>}
    </div>
  )
}

/** Coaching night starts with warm-ups: your own recent errors, freshest first. */
function WarmupCard({ count, week, onStart }: { count: number; week: number; onStart: () => void }) {
  return (
    <section className="next-card">
      <p className="next-kind">{sessionLabel('coaching')} · warm-ups</p>
      <h2>
        {count} position{count === 1 ? '' : 's'} from your own games
      </h2>
      <p className="next-opponent">
        <Portrait who="pemberton" size={44} />
        <span>
          <strong>Coach Pemberton</strong>{' '}
          <span className="next-rating">“{warmupLine(week)}”</span>
        </span>
      </p>
      <button type="button" className="next-play" onClick={onStart}>
        Start warm-ups
      </button>
    </section>
  )
}

/** Graham, catching up with someone who joined before names were asked for. */
function MissingName({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <section className="missing-name">
      <NameField
        value={name}
        onChange={setName}
        prompt="We never got your name for the membership list. Strictly speaking, that's irregular."
      />
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
        <p className="next-kind">{next.location}</p>
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
        <p className="next-kind">The club knockout cup</p>
        <h2>You won the cup.</h2>
        <p className="next-note">More to come. The ladder goes up next week.</p>
      </section>
    )
  }
  if (next.kind !== 'play') return null

  const { game, optionalFriendly, note } = next
  const character = findCharacter(game.opponent)
  return (
    <PlayCard
      {...{
        game,
        optionalFriendly,
        note,
        character,
        onPlay,
        onTargetedPuzzles,
        next,
      }}
    />
  )
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
        {/* Club-week games already say which night it is ("Thursday · practice night"). */}
        {game.kind === 'friendly' || game.kind === 'match' || game.kind === 'coaching'
          ? game.location
          : `${KIND_LABELS[game.kind]} · ${game.location}`}
      </p>
      <h2>{game.label}</h2>
      <p className="next-opponent">
        <Portrait who={game.opponent} size={44} />
        <span>
          <strong>{character?.name ?? game.opponent}</strong>{' '}
          {/* No ratings on trial night (Joseph, Sep 2026): they'd differ from
              the ladder once your own rating is worked out. Names only. */}
          {game.kind !== 'trial' && game.kind !== 'exhibition' && <span className="next-rating">{game.rating}</span>}
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
          {optionalFriendly.stage === 'assisted'
            ? 'Study him first: a practice game with full help'
            : 'Another practice game first'}
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
  return stage === 'assisted' ? 'Full help' : stage === 'guided' ? 'Move feedback, 3 takebacks' : 'No help'
}
