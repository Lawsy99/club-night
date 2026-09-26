// A lesson: a line or two from Coach Pemberton while a real puzzle from the
// character's opening plays itself out as the example, then a few more of the
// same kind to solve (design document, "Lessons", as revised Sep 2026).
import { useEffect, useMemo, useState } from 'react'
import { DemoBoard } from '../components/DemoBoard'
import { PuzzleTrainer } from '../components/PuzzleTrainer'
import { findLesson } from '../data/lessons'
import { themeCaption } from '../data/themes'
import { loadPuzzleBank } from '../engine/puzzleBank'
import { puzzleDemo } from '../logic/demo'
import { pickPuzzles, ratePuzzle, solverColour, type Puzzle } from '../logic/puzzles'
import { loadPuzzleProgress, savePuzzleProgress, type PuzzleProgress } from '../storage/db'
import './ReviewScreen.css'

type Props = {
  chapterId: string
  /** Sets the first puzzle rating, if the player has none yet. */
  playerRating: number
  onDone: () => void
  onBack: () => void
}

export function LessonScreen({ chapterId, playerRating, onDone, onBack }: Props) {
  const lesson = findLesson(chapterId)
  const [phase, setPhase] = useState<'demo' | 'puzzles' | 'done'>('demo')
  const [example, setExample] = useState<Puzzle | null>(null)
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null)
  const [index, setIndex] = useState(0)
  const [puzzleDone, setPuzzleDone] = useState(false)
  const [progress, setProgress] = useState<PuzzleProgress | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!lesson) return
    Promise.all([loadPuzzleBank(), loadPuzzleProgress()])
      .then(([bank, saved]) => {
        const start: PuzzleProgress = saved ?? { rating: { rating: playerRating, deviation: 250, volatility: 0.06 }, seen: [] }
        setProgress(start)
        const picked = pickPuzzles(bank, {
          themes: lesson.themes,
          openings: lesson.openings,
          both: !!lesson.openings,
          rating: start.rating.rating,
          count: lesson.count + 1,
          exclude: new Set(start.seen),
        })
        // The easiest one is the worked example; the rest are for the player.
        const sorted = [...picked].sort((a, b) => a.rating - b.rating)
        setExample(sorted[0] ?? null)
        setPuzzles(sorted.slice(1))
      })
      .catch(() => setLoadError(true))
  }, [lesson, playerRating])

  const demo = useMemo(
    () => (example && lesson ? puzzleDemo(example, lesson.intro, themeCaption(lesson.themes)) : null),
    [example, lesson],
  )

  if (!lesson || loadError) {
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

  if (!demo || !puzzles) return <main className="review-screen">Setting up the lesson…</main>

  if (phase === 'demo') {
    return (
      <main className="review-screen with-board">
        <header className="review-topline">
          <p className="review-kicker">Lesson · {lesson.title}</p>
          <button type="button" className="review-skip" onClick={onBack}>
            Back
          </button>
        </header>
        <DemoBoard
          key={example!.id}
          startFen={example!.fen}
          steps={demo}
          orientation={solverColour(example!) === 'w' ? 'white' : 'black'}
          finishLabel="Your turn"
          onFinish={() => setPhase('puzzles')}
        />
      </main>
    )
  }

  if (phase === 'puzzles' && puzzles[index]) {
    const puzzle = puzzles[index]
    return (
      <main className="review-screen with-board">
        <header className="review-topline">
          <p className="review-kicker">
            {lesson.title} · {index + 1} of {puzzles.length}
          </p>
          <button type="button" className="review-skip" onClick={() => setPhase('done')}>
            Skip
          </button>
        </header>
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
