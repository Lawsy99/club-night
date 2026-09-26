// A set of puzzles on its own (no lesson bubbles), e.g. the targeted set
// that unlocks after a third loss to a boss (design document, "Support after
// boss losses").
import { useEffect, useState } from 'react'
import { PuzzleTrainer } from '../components/PuzzleTrainer'
import { loadPuzzleBank } from '../engine/puzzleBank'
import { pickPuzzles, ratePuzzle, type Puzzle } from '../logic/puzzles'
import { loadPuzzleProgress, savePuzzleProgress, type PuzzleProgress } from '../storage/db'
import './ReviewScreen.css'

type Props = {
  title: string
  themes?: string[]
  openings?: string[]
  count: number
  playerRating: number
  onDone: () => void
}

export function PuzzleSetScreen({ title, themes, openings, count, playerRating, onDone }: Props) {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null)
  const [progress, setProgress] = useState<PuzzleProgress | null>(null)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    Promise.all([loadPuzzleBank(), loadPuzzleProgress()])
      .then(([bank, saved]) => {
        const start: PuzzleProgress = saved ?? { rating: { rating: playerRating, deviation: 250, volatility: 0.06 }, seen: [] }
        setProgress(start)
        setPuzzles(pickPuzzles(bank, { themes, openings, rating: start.rating.rating, count, exclude: new Set(start.seen) }))
      })
      .catch(() => setFailed(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, [])

  if (failed) {
    return (
      <main className="review-screen">
        <p className="review-note">The puzzles couldn't load (are you offline?).</p>
        <button type="button" className="review-continue" onClick={onDone}>
          Back
        </button>
      </main>
    )
  }
  if (!puzzles) return <main className="review-screen">Finding puzzles…</main>

  const puzzle = puzzles[index]
  if (!puzzle) {
    return (
      <main className="review-screen">
        <header>
          <p className="review-kicker">{title}</p>
          <h1>Set complete</h1>
        </header>
        {progress && <p className="review-note">Puzzle rating: {Math.round(progress.rating.rating)}</p>}
        <button type="button" className="review-continue" onClick={onDone}>
          Back
        </button>
      </main>
    )
  }

  return (
    <main className="review-screen with-board">
      <header className="review-topline">
        <p className="review-kicker">
          {title} · {index + 1} of {puzzles.length}
        </p>
        <button type="button" className="review-skip" onClick={onDone}>
          Back
        </button>
      </header>
      <PuzzleTrainer
        key={puzzle.id}
        puzzle={puzzle}
        onFinished={(clean) => {
          setDone(true)
          if (!progress) return
          const next = { rating: ratePuzzle(progress.rating, puzzle.rating, clean), seen: [...progress.seen, puzzle.id] }
          setProgress(next)
          savePuzzleProgress(next).catch((err) => console.error('Save failed', err))
        }}
      />
      <button
        type="button"
        className="review-continue"
        disabled={!done}
        onClick={() => {
          setIndex((i) => i + 1)
          setDone(false)
          window.scrollTo({ top: 0 })
        }}
      >
        {index + 1 < puzzles.length ? 'Next puzzle' : 'Finish'}
      </button>
    </main>
  )
}
