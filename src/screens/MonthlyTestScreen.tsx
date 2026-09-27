// Pemberton's monthly test (logic/monthlyTest.ts): six mixed positions, one
// try each, at a level fixed by the first test so the scores can be compared.
import { useEffect, useState } from 'react'
import { Portrait } from '../components/Portrait'
import { PuzzleTrainer } from '../components/PuzzleTrainer'
import { loadPuzzleBank } from '../engine/puzzleBank'
import { testBaseline, testTargets, testVerdict, type MonthlyTest } from '../logic/monthlyTest'
import type { Progress } from '../logic/path'
import { pickPuzzles, ratePuzzle, type Puzzle } from '../logic/puzzles'
import { loadPuzzleProgress, savePuzzleProgress, type PuzzleProgress } from '../storage/db'
import './ReviewScreen.css'

type Props = {
  progress: Progress
  month: number
  playerRating: number
  onFinished: (test: MonthlyTest) => void
  onBack: () => void
}

export function MonthlyTestScreen({ progress, month, playerRating, onFinished, onBack }: Props) {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null)
  const [puzzleProgress, setPuzzleProgress] = useState<PuzzleProgress | null>(null)
  const [baseline, setBaseline] = useState(0)
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    Promise.all([loadPuzzleBank(), loadPuzzleProgress()])
      .then(([bank, saved]) => {
        const start: PuzzleProgress = saved ?? { rating: { rating: playerRating, deviation: 250, volatility: 0.06 }, seen: [] }
        const level = testBaseline(progress, start.rating.rating)
        // One position near each step, all different and none seen before.
        const exclude = new Set(start.seen)
        const picked: Puzzle[] = []
        for (const rating of testTargets(level)) {
          const [p] = pickPuzzles(bank, { rating, count: 1, exclude })
          if (!p) continue
          picked.push(p)
          exclude.add(p.id)
        }
        setPuzzleProgress(start)
        setBaseline(level)
        setPuzzles(picked)
      })
      .catch(() => setFailed(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, [])

  if (failed) {
    return (
      <main className="review-screen">
        <p className="review-note">The positions couldn't load (are you offline?).</p>
        <button type="button" className="review-continue" onClick={onBack}>
          Back
        </button>
      </main>
    )
  }
  if (!puzzles) return <main className="review-screen">Setting the test…</main>

  const previous = progress.monthlyTests?.at(-1)

  if (!started) {
    return (
      <main className="review-screen">
        <header>
          <p className="review-kicker">Month {month} · the monthly test</p>
          <h1>Six positions</h1>
        </header>
        <p className="next-opponent">
          <Portrait who="pemberton" size={44} />
          <span className="review-note">
            “Once a month I like to see where you are. Six positions, one try each, no hints. Same standard every
            time, so we can tell if it’s going in.”
          </span>
        </p>
        {previous && (
          <p className="review-note">
            Last time: {previous.score} of {previous.out}.
          </p>
        )}
        <button type="button" className="review-continue" onClick={() => setStarted(true)}>
          Start the test
        </button>
        <button type="button" className="review-skip" onClick={onBack}>
          Not now
        </button>
      </main>
    )
  }

  const puzzle = puzzles[index]
  if (!puzzle) {
    return (
      <main className="review-screen">
        <header>
          <p className="review-kicker">Month {month} · the monthly test</p>
          <h1>
            {score} of {puzzles.length}
          </h1>
        </header>
        <p className="next-opponent">
          <Portrait who="pemberton" size={44} />
          <span className="review-note">“{testVerdict(score, puzzles.length, previous)}”</span>
        </p>
        <button
          type="button"
          className="review-continue"
          onClick={() => onFinished({ month, score, out: puzzles.length, baseline, at: Date.now() })}
        >
          Done
        </button>
      </main>
    )
  }

  return (
    <main className="review-screen with-board">
      <header className="review-topline">
        <p className="review-kicker">
          Monthly test · {index + 1} of {puzzles.length}
        </p>
      </header>
      <PuzzleTrainer
        key={puzzle.id}
        puzzle={puzzle}
        oneTry
        onFinished={(clean) => {
          setDone(true)
          if (clean) setScore((s) => s + 1)
          if (!puzzleProgress) return
          const next = { rating: ratePuzzle(puzzleProgress.rating, puzzle.rating, clean), seen: [...puzzleProgress.seen, puzzle.id] }
          setPuzzleProgress(next)
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
        {index + 1 < puzzles.length ? 'Next position' : 'See how you did'}
      </button>
    </main>
  )
}
