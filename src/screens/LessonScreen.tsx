// A lesson (design document, "Lessons", as revised Sep 2026). Three kinds:
// - tactics: a real puzzle from the week's opening plays out as the example,
//   then a few more of the same kind to solve;
// - opening: Pemberton plays the opening through, then you play it yourself;
// - finishing: you play a won ending out against the engine, then puzzles.
import { useEffect, useMemo, useState } from 'react'
import { DemoBoard } from '../components/DemoBoard'
import { EndgameDrill } from '../components/EndgameDrill'
import { OpeningDrill } from '../components/OpeningDrill'
import { PuzzleTrainer } from '../components/PuzzleTrainer'
import { endgameFor } from '../data/endgameDrills'
import { findLesson } from '../data/lessons'
import { OPENING_DRILLS } from '../data/openingLessons'
import { themeCaption, themeTip } from '../data/themes'
import { resolveOpponent } from '../data/opponents'
import { MomentTrainer } from '../components/MomentTrainer'
import { Portrait } from '../components/Portrait'
import { findOwnExample, type OwnExample } from '../logic/lessonExtras'
import { listArchivedGames } from '../storage/db'
import { loadPuzzleBank } from '../engine/puzzleBank'
import { buildDemo, puzzleDemo } from '../logic/demo'
import { pickPuzzles, ratePuzzle, solverColour, type Puzzle } from '../logic/puzzles'
import { loadPuzzleProgress, savePuzzleProgress, type PuzzleProgress } from '../storage/db'
import './ReviewScreen.css'

type Props = {
  chapterId: string
  /** Sets the first puzzle rating, if the player has none yet; also picks the finishing position. */
  playerRating: number
  onDone: () => void
  onBack: () => void
}

type Phase = 'demo' | 'drill' | 'puzzles' | 'own' | 'done'

/** From this rating, the opening basics are offered as optional. */
const STRONG_PLAYER = 1600

export function LessonScreen({ chapterId, playerRating, onDone, onBack }: Props) {
  const lesson = findLesson(chapterId)
  const kind = lesson?.kind ?? 'tactics'
  const [phase, setPhase] = useState<Phase>(kind === 'endgame' ? 'drill' : 'demo')
  const [example, setExample] = useState<Puzzle | null>(null)
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null)
  const [index, setIndex] = useState(0)
  const [puzzleDone, setPuzzleDone] = useState(false)
  const [progress, setProgress] = useState<PuzzleProgress | null>(null)
  const [loadError, setLoadError] = useState(false)
  // Puzzles solved without help, for the wrap-up.
  const [cleanCount, setCleanCount] = useState(0)
  // An example of the theme from your own games, if there is one (Sep 2026).
  const [own, setOwn] = useState<OwnExample | null>(null)
  const [ownDone, setOwnDone] = useState(false)
  useEffect(() => {
    if (!lesson || lesson.themes.length === 0) return
    let cancelled = false
    listArchivedGames()
      .then((games) => {
        const mine = games.slice(0, 30).map((g) => ({
          id: g.id,
          moves: g.moves,
          evals: g.evals,
          playerColour: g.playerColour,
          opponentName: resolveOpponent(g.levelId, g.opponentRating).name,
          finishedAt: g.finishedAt,
        }))
        const example = findOwnExample(mine, lesson.themes)
        if (!cancelled) setOwn(example)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [lesson])

  const opening = kind === 'opening' && lesson?.drill ? OPENING_DRILLS[lesson.drill] : undefined
  const ending = kind === 'endgame' && lesson?.drill ? endgameFor(lesson.drill, playerRating) : undefined
  const wantsPuzzles = !!lesson && lesson.count > 0

  useEffect(() => {
    if (!lesson || !wantsPuzzles) return
    Promise.all([loadPuzzleBank(), loadPuzzleProgress()])
      .then(([bank, saved]) => {
        const start: PuzzleProgress = saved ?? { rating: { rating: playerRating, deviation: 250, volatility: 0.06 }, seen: [] }
        setProgress(start)
        const picked = pickPuzzles(bank, {
          themes: lesson.themes,
          openings: lesson.openings,
          both: !!lesson.openings,
          rating: start.rating.rating,
          count: lesson.count + (kind === 'tactics' ? 1 : 0),
          exclude: new Set(start.seen),
        })
        // Tactics: the easiest one is the worked example; the rest are for the player.
        const sorted = [...picked].sort((a, b) => a.rating - b.rating)
        setExample(kind === 'tactics' ? (sorted[0] ?? null) : null)
        setPuzzles(kind === 'tactics' ? sorted.slice(1) : sorted)
      })
      .catch(() => setLoadError(true))
  }, [lesson, playerRating, wantsPuzzles, kind])

  // Opening lessons are basics: a strong player is told so, and can skip
  // (Joseph, Sep 2026: lessons have to suit 500 and 2500 alike).
  const strong = playerRating >= STRONG_PLAYER
  const demo = useMemo(() => {
    if (!lesson) return null
    if (opening) {
      const first = strong ? `${lesson.intro} You’ll know most of this already. Humour me, or skip it: your call.` : lesson.intro
      return buildDemo([{ caption: first }, ...opening.demo])
    }
    return example ? puzzleDemo(example, lesson.intro, themeCaption(lesson.themes)) : null
  }, [example, lesson, opening, strong])

  const header = (label: string, action: { text: string; onClick: () => void }) => (
    <header className="review-topline">
      <p className="review-kicker">{label}</p>
      <button type="button" className="review-skip" onClick={action.onClick}>
        {action.text}
      </button>
    </header>
  )
  const afterDrill = () => setPhase(wantsPuzzles ? 'puzzles' : own ? 'own' : 'done')
  // After the puzzles: your own example, if there is one, then the wrap-up.
  const afterPuzzles: Phase = own ? 'own' : 'done'
  const tip = lesson ? themeTip(lesson.themes) : null

  if (!lesson || (loadError && kind === 'tactics')) {
    return (
      <main className="review-screen">
        <p className="review-note">
          {loadError ? "The puzzles couldn't load (are you offline?). You can carry on without them." : "This lesson isn't written yet."}
        </p>
        <button type="button" className="review-continue" onClick={onDone}>
          Continue
        </button>
      </main>
    )
  }

  if (phase === 'demo') {
    if (!demo) return <main className="review-screen">Setting up the lesson…</main>
    return (
      <main className="review-screen with-board">
        {header(`Lesson · ${lesson.title}`, opening && strong ? { text: 'Skip', onClick: onDone } : { text: 'Back', onClick: onBack })}
        <DemoBoard
          key={opening ? opening.id : example!.id}
          startFen={opening ? undefined : example!.fen}
          steps={demo}
          orientation={
            opening ? (opening.colour === 'b' ? 'black' : 'white') : solverColour(example!) === 'w' ? 'white' : 'black'
          }
          finishLabel="Your turn"
          onFinish={() => setPhase(opening ? 'drill' : 'puzzles')}
        />
      </main>
    )
  }

  if (phase === 'drill' && (opening || ending)) {
    return (
      <main className="review-screen with-board">
        {header(`Lesson · ${lesson.title}`, { text: 'Back', onClick: onBack })}
        {ending && <p className="review-note">{lesson.intro}</p>}
        {opening ? <OpeningDrill drill={opening} onDone={afterDrill} /> : <EndgameDrill position={ending!} onDone={afterDrill} />}
      </main>
    )
  }

  // (If the puzzles couldn't load, or there are none left, it falls through to "Lesson complete".)
  if (phase === 'puzzles' && !loadError && !puzzles) return <main className="review-screen">Setting up the puzzles…</main>
  const puzzle = phase === 'puzzles' && !loadError ? puzzles?.[index] : undefined
  if (puzzle && puzzles) {
    return (
      <main className="review-screen with-board">
        {header(`${lesson.title} · ${index + 1} of ${puzzles.length}`, { text: 'Skip', onClick: () => setPhase(afterPuzzles) })}
        {index === 0 && tip && <p className="review-note lesson-tip">Pemberton’s tip: {tip}</p>}
        <PuzzleTrainer
          key={puzzle.id}
          puzzle={puzzle}
          focus={lesson.themes}
          onFinished={(clean) => {
            setPuzzleDone(true)
            if (clean) setCleanCount((n) => n + 1)
            if (!progress) return
            const next = { rating: ratePuzzle(progress.rating, puzzle.rating, clean), seen: [...progress.seen, puzzle.id] }
            setProgress(next)
            savePuzzleProgress(next).catch((err) => console.error('Save failed', err))
          }}
        />
        <button
          type="button"
          className="review-continue"
          disabled={!puzzleDone}
          onClick={() => {
            if (index + 1 >= puzzles.length) setPhase(afterPuzzles)
            else {
              setIndex((i) => i + 1)
              setPuzzleDone(false)
              window.scrollTo({ top: 0 })
            }
          }}
        >
          {index + 1 < puzzles.length ? 'Next puzzle' : 'Finish'}
        </button>
      </main>
    )
  }

  // Your own game: the theme, in a position you actually had.
  if (phase === 'own' && own) {
    const date = new Date(own.finishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return (
      <main className="review-screen with-board">
        {header('From your own games', { text: 'Skip', onClick: () => setPhase('done') })}
        <div className="moment-coach lesson-own">
          <Portrait who="pemberton" size={36} />
          <p className="moment-explanation">
            You had one of these against {own.opponentName} on {date}.{' '}
            {own.missed ? 'You didn’t see it then. Find it now.' : 'You found it then. Find it again.'}
          </p>
        </div>
        <MomentTrainer moment={own.moment} onFinished={() => setOwnDone(true)} />
        <button type="button" className="review-continue" disabled={!ownDone} onClick={() => setPhase('done')}>
          Finish
        </button>
      </main>
    )
  }

  // The wrap-up: how it went, and the one thing to take away.
  const solvedAll = puzzles !== null && puzzles.length > 0 && cleanCount === puzzles.length
  return (
    <main className="review-screen">
      <header>
        <p className="review-kicker">Lesson complete</p>
        <h1>{lesson.title}</h1>
      </header>
      {puzzles && puzzles.length > 0 && (
        <div className="moment-coach lesson-wrap">
          <Portrait who="pemberton" size={36} expression={solvedAll ? 'pleased' : 'neutral'} />
          <div>
            <p className="moment-coach-name">Coach Pemberton</p>
            <p className="moment-explanation">
              {solvedAll
                ? `All ${puzzles.length} without help. Good. Now look for them in your games.`
                : `You found ${cleanCount} of ${puzzles.length} without help.${tip ? ` The one thing to remember this week: ${tip.charAt(0).toLowerCase()}${tip.slice(1)}` : ''}`}
            </p>
          </div>
        </div>
      )}
      {progress && <p className="review-note">Puzzle rating: {Math.round(progress.rating.rating)}</p>}
      <button type="button" className="review-continue" onClick={onDone}>
        Continue
      </button>
    </main>
  )
}
