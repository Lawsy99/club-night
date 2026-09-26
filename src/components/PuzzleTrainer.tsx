// Solving one puzzle: the opponent's setup move plays first, then the player
// finds each move. A wrong answer shows a hint and allows another try; a
// second miss shows the move and carries on. No penalty beyond the puzzle rating.
import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import { applyUci } from '../logic/game'
import { isCorrect, solverColour, type Puzzle } from '../logic/puzzles'
import { Board } from './Board'
import { HINT_ARROW_COLOUR } from './lineArrows'
import './PuzzleTrainer.css'

type Props = {
  puzzle: Puzzle
  /** Told when the puzzle is done: solved without any wrong answer or not. */
  onFinished: (solvedCleanly: boolean) => void
  /** The lesson's themes, listed first (so a forks lesson says "fork" first). */
  focus?: readonly string[]
}

const PAUSE_MS = 600

export function PuzzleTrainer({ puzzle, onFinished, focus = [] }: Props) {
  const [fen, setFen] = useState(puzzle.fen)
  const [step, setStep] = useState(0) // index into puzzle.moves of the next move to play
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [misses, setMisses] = useState(0) // wrong tries on the current move
  const [clean, setClean] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [reveal, setReveal] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const solver = solverColour(puzzle)

  /** Plays a move from the puzzle's list onto the board. */
  function play(uci: string, fromFen: string): string {
    const chess = new Chess(fromFen)
    applyUci(chess, uci)
    setLastMove({ from: uci.slice(0, 2), to: uci.slice(2, 4) })
    return chess.fen()
  }

  // The opponent's setup move, after a moment so the player sees what happened.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setFen(play(puzzle.moves[0], puzzle.fen))
      setStep(1)
    }, PAUSE_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per puzzle
  }, [puzzle.id])

  /** Moves on after a correct (or revealed) player move at `at`. */
  function advance(afterFen: string, at: number, stillClean: boolean) {
    setMisses(0)
    setReveal(null)
    if (at + 1 >= puzzle.moves.length) {
      setDone(true)
      setMessage(stillClean ? 'Solved!' : 'Solved, with a little help.')
      onFinished(stillClean)
      return
    }
    // The opponent's reply.
    setStep(-1) // locks the board during the pause
    window.setTimeout(() => {
      setFen(play(puzzle.moves[at + 1], afterFen))
      setStep(at + 2)
      setMessage(null) // back to "find the best move" for the next one
    }, PAUSE_MS / 1.5)
  }

  function handleMove(uci: string) {
    if (step < 1 || done) return
    if (isCorrect(puzzle, fen, step, uci)) {
      const next = play(uci, fen)
      setFen(next)
      setMessage(misses === 0 ? 'Correct.' : 'That’s it.')
      advance(next, step, clean)
      return
    }
    setClean(false)
    if (misses === 0) {
      setMisses(1)
      setMessage(`Not that one. Hint: look at your piece on ${puzzle.moves[step].slice(0, 2)}.`)
    } else {
      // Second miss: show the move, play it, and carry on.
      const answer = puzzle.moves[step]
      setReveal(answer)
      setMessage('Here’s the move.')
      setStep(-1)
      window.setTimeout(() => {
        const next = play(answer, fen)
        setFen(next)
        advance(next, step, false)
      }, 1200)
    }
  }

  const hintSquare = misses > 0 && step >= 1 ? puzzle.moves[step].slice(0, 2) : null
  const prompt = done
    ? message
    : step === 0
      ? 'Watch the last move…'
      : step < 0
        ? (message ?? 'Their reply…')
        : (message ?? `${solver === 'w' ? 'White' : 'Black'} to move. Find the best move.`)

  return (
    <div className="puzzle">
      <Board
        fen={fen}
        orientation={solver === 'w' ? 'white' : 'black'}
        movableColour={done || step < 1 ? null : solver}
        lastMove={lastMove}
        onMove={handleMove}
        hintSquare={hintSquare}
        arrows={reveal ? [{ from: reveal.slice(0, 2), to: reveal.slice(2, 4), colour: HINT_ARROW_COLOUR }] : []}
      />
      <p className={`puzzle-prompt${done ? (clean ? ' solved' : ' helped') : ''}`}>{prompt}</p>
      <p className="puzzle-meta">
        Puzzle rated {puzzle.rating}
        {puzzle.themes.length > 0 &&
          ` · ${[...puzzle.themes]
            .filter((t) => !['advantage', 'crushing', 'equality', 'middlegame', 'endgame', 'opening', 'short', 'long'].includes(t))
            .sort((a, b) => Number(focus.includes(b)) - Number(focus.includes(a)))
            .slice(0, 2)
            .map(themeName)
            .join(', ')}`}
      </p>
    </div>
  )
}

/** "backRankMate" → "back rank mate". */
function themeName(theme: string): string {
  return theme.replace(/([A-Z])/g, ' $1').replace(/(\d)/g, ' $1').toLowerCase()
}
