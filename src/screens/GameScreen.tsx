// Phase 1, step 1: a board where you move both sides, to check the rules and
// the feel of the board on a phone. Stockfish joins in step 2.
import { useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { applyUci, describeOutcome, getOutcome, replay } from '../logic/game'
import './GameScreen.css'

export function GameScreen() {
  const [moves, setMoves] = useState<string[]>([])

  // Everything on screen is derived from the move list.
  const chess = useMemo(() => replay(moves), [moves])
  const outcome = getOutcome(chess)
  const last = chess.history({ verbose: true }).at(-1)

  function handleMove(uci: string) {
    // Double-check legality before accepting, then store the move.
    if (applyUci(replay(moves), uci)) setMoves([...moves, uci])
  }

  const status = outcome
    ? describeOutcome(outcome)
    : `${chess.turn() === 'w' ? 'White' : 'Black'} to move${chess.inCheck() ? ' · check' : ''}`

  return (
    <main className="game-screen">
      <header className="game-header">
        <h1>Test board</h1>
        <p className="stage-label">Both sides · no engine yet</p>
      </header>

      <p className={outcome ? 'game-status game-over' : 'game-status'}>{status}</p>

      <Board
        fen={chess.fen()}
        orientation="white"
        movableColour={outcome ? null : chess.turn()}
        lastMove={last ? { from: last.from, to: last.to } : null}
        onMove={handleMove}
      />

      <p className="last-move">{last ? `Last move: ${last.san}` : 'Tap a piece, then a square. Or drag.'}</p>

      <div className="game-actions">
        <button type="button" onClick={() => setMoves([])} disabled={moves.length === 0}>
          New game
        </button>
      </div>
    </main>
  )
}
