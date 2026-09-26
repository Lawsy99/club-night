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
import { themeCaption } from '../data/themes'
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

type Phase = 'demo' | 'drill' | 'puzzles' | 'done'

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

  const demo = useMemo(() => {
    if (!lesson) return null
    if (opening) return buildDemo([{ caption: lesson.intro }, ...opening.demo])
    return example ? puzzleDemo(example, lesson.intro, themeCaption(lesson.themes)) : null
  }, [example, lesson, opening])

  const header = (label: string, action: { text: string; onClick: () => void }) => (
    <header className="review-topline">
      <p className="review-kicker">{label}</p>
      <button type="button" className="review-skip" onClick={action.onClick}>
        {action.text}
      </button>
    </header>
  )
  const afterDrill = () => setPhase(wantsPuzzles ? 'puzzles' : 'done')

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
        {header(`Lesson · ${lesson.title}`, { text: 'Back', onClick: onBack })}
        <DemoBoard
          key={opening ? opening.id : example!.id}
          startFen={opening ? undefined : example!.fen}
          steps={demo}
          orientation={opening || solverColour(example!) === 'w' ? 'white' : 'black'}
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
        {header(`${lesson.title} · ${index + 1} of ${puzzles.length}`, { text: 'Skip', onClick: () => setPhase('done') })}
        <PuzzleTrainer
          key={puzzle.id}
          puzzle={puzzle}
          focus={lesson.themes}
          onFinished={(clean) => {
            setPuzzleDone(true)
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
            if (index + 1 >= puzzles.length) setPhase('done')
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

  return (
    <main className="review-screen">
      <header>
        <p className="review-kicker">Lesson complete</p>
        <h1>{lesson.title}</h1>
      </header>
      {progress && <p className="review-note">Puzzle rating: {Math.round(progress.rating.rating)}</p>}
      <button type="button" className="review-continue" onClick={onDone}>
        Continue
      </button>
    </main>
  )
}
