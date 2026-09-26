// A lesson: Coach Pemberton's bubbles over a demonstration board, then a few
// puzzles on the same theme (design document, "Lessons"). About two minutes.
import { useEffect, useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { PuzzleTrainer } from '../components/PuzzleTrainer'
import { findLesson, lessonLevel } from '../data/lessons'
import { loadPuzzleBank } from '../engine/puzzleBank'
import type { PlayerRating } from '../logic/glicko2'
import { lessonFrames } from '../logic/lessons'
import { pickPuzzles, ratePuzzle, type Puzzle } from '../logic/puzzles'
import { loadPuzzleProgress, savePuzzleProgress, type PuzzleProgress } from '../storage/db'
import './LessonScreen.css'
import './ReviewScreen.css'

type Props = {
  chapterId: string
  /** The player's rating picks the lesson version and the puzzles' difficulty. */
  playerRating: number
  onDone: () => void
  onBack: () => void
}

export function LessonScreen({ chapterId, playerRating, onDone, onBack }: Props) {
  const lesson = findLesson(chapterId)
  const version = lesson?.[lessonLevel(playerRating)]
  const frames = useMemo(() => (version ? lessonFrames(version.bubbles) : []), [version])
  const [bubble, setBubble] = useState(0)
  const [phase, setPhase] = useState<'talk' | 'puzzles' | 'done'>('talk')
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null)
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [puzzleDone, setPuzzleDone] = useState(false)
  const [progress, setProgress] = useState<PuzzleProgress | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Load the puzzles while the player reads the bubbles.
  useEffect(() => {
    if (!version) return
    Promise.all([loadPuzzleBank(), loadPuzzleProgress()])
      .then(([bank, saved]) => {
        // A first puzzle rating starts from the playing rating, fairly uncertain.
        const start: PuzzleProgress = saved ?? {
          rating: { rating: playerRating, deviation: 250, volatility: 0.06 } satisfies PlayerRating,
          seen: [],
        }
        setProgress(start)
        setPuzzles(
          pickPuzzles(bank, {
            themes: version.puzzles.themes,
            openings: version.puzzles.openings,
            rating: start.rating.rating,
            count: version.puzzles.count,
            exclude: new Set(start.seen),
          }),
        )
      })
      .catch(() => setLoadError(true))
  }, [version, playerRating])

  if (!lesson || !version) {
    return (
      <main className="review-screen">
        <p className="review-note">This lesson isn't written yet.</p>
        <button type="button" className="review-continue" onClick={onDone}>
          Continue
        </button>
      </main>
    )
  }

  function finishPuzzle(clean: boolean, puzzle: Puzzle) {
    setPuzzleDone(true)
    if (!progress) return
    const next: PuzzleProgress = {
      rating: ratePuzzle(progress.rating, puzzle.rating, clean),
      seen: [...progress.seen, puzzle.id],
    }
    setProgress(next)
    savePuzzleProgress(next).catch((err) => console.error('Save failed', err))
  }

  if (phase === 'talk') {
    const frame = frames[bubble]
    const last = bubble === frames.length - 1
    return (
      <main className="review-screen with-board lesson">
        <header className="review-topline">
          <p className="review-kicker">Lesson · {bubble + 1} of {frames.length}</p>
          <button type="button" className="review-skip" onClick={onBack}>
            Back
          </button>
        </header>
        <h1 className="lesson-title">{lesson.title}</h1>
        <Board fen={frame.fen} orientation={lesson.orientation} movableColour={null} lastMove={frame.lastMove} onMove={() => {}} />
        <div className="coach-bubble">
          <span className="coach-portrait" aria-hidden="true">
            P
          </span>
          <div>
            <strong>Coach Pemberton</strong>
            <p>{frame.text}</p>
          </div>
        </div>
        <div className="lesson-nav">
          <button type="button" disabled={bubble === 0} onClick={() => setBubble((b) => b - 1)}>
            Back
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => (last ? setPhase('puzzles') : setBubble((b) => b + 1))}
          >
            {last ? 'Puzzles' : 'Next'}
          </button>
        </div>
      </main>
    )
  }

  if (phase === 'puzzles') {
    if (loadError) {
      return (
        <main className="review-screen">
          <p className="review-note">The puzzles couldn't load (are you offline?). You can carry on without them.</p>
          <button type="button" className="review-continue" onClick={() => setPhase('done')}>
            Continue
          </button>
        </main>
      )
    }
    if (!puzzles) return <main className="review-screen">Finding puzzles…</main>
    const puzzle = puzzles[puzzleIndex]
    if (!puzzle) {
      return (
        <main className="review-screen">
          <p className="review-note">No puzzles to show for this one.</p>
          <button type="button" className="review-continue" onClick={() => setPhase('done')}>
            Continue
          </button>
        </main>
      )
    }
    return (
      <main className="review-screen with-board">
        <header className="review-topline">
          <p className="review-kicker">
            Puzzle {puzzleIndex + 1} of {puzzles.length}
          </p>
          <button type="button" className="review-skip" onClick={() => setPhase('done')}>
            Skip
          </button>
        </header>
        <PuzzleTrainer key={puzzle.id} puzzle={puzzle} onFinished={(clean) => finishPuzzle(clean, puzzle)} />
        <button
          type="button"
          className="review-continue"
          disabled={!puzzleDone}
          onClick={() => {
            if (puzzleIndex + 1 >= puzzles.length) {
              setPhase('done')
              return
            }
            setPuzzleIndex((i) => i + 1)
            setPuzzleDone(false)
            window.scrollTo({ top: 0 })
          }}
        >
          {puzzleIndex + 1 < puzzles.length ? 'Next puzzle' : 'Finish'}
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
      {progress && (
        <p className="review-note">Puzzle rating: {Math.round(progress.rating.rating)}</p>
      )}
      <button type="button" className="review-continue" onClick={onDone}>
        Continue
      </button>
    </main>
  )
}
