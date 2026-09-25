// Phase 1 test game against plain Stockfish. Colours swap on every new game.
// Saving, resuming and the help stages arrive in steps 3 and 4.
import { useEffect, useMemo, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { Board } from '../components/Board'
import {
  DEFAULT_TEST_LEVEL_ID,
  TEST_OPPONENT_LEVELS,
} from '../data/testOpponents'
import { chooseTestOpponentMove } from '../engine/testOpponent'
import { applyUci, describeOutcome, getOutcome, replay, type Colour } from '../logic/game'
import './GameScreen.css'

export function GameScreen() {
  const [moves, setMoves] = useState<string[]>([])
  const [playerColour, setPlayerColour] = useState<Colour>('w')
  const [levelId, setLevelId] = useState(DEFAULT_TEST_LEVEL_ID)
  const [engineError, setEngineError] = useState<string | null>(null)
  const level = TEST_OPPONENT_LEVELS.find((l) => l.id === levelId) ?? TEST_OPPONENT_LEVELS[0]

  // Everything on screen is derived from the move list.
  const chess = useMemo(() => replay(moves), [moves])
  const fen = chess.fen()
  const outcome = getOutcome(chess)
  const last = chess.history({ verbose: true }).at(-1)
  const opponentToMove = !outcome && chess.turn() !== playerColour

  function addMove(uci: string) {
    // Double-check legality before accepting, then store the move.
    setMoves((current) => (applyUci(replay(current), uci) ? [...current, uci] : current))
  }

  // When it's the opponent's turn, ask the engine (in the background) for a move.
  useEffect(() => {
    if (!opponentToMove) return
    let cancelled = false // set if the game changes before the engine replies
    chooseTestOpponentMove(fen, level)
      .then((move) => {
        if (!cancelled && move) addMove(move)
      })
      .catch((err: Error) => setEngineError(err.message))
    return () => {
      cancelled = true
    }
  }, [opponentToMove, fen, level])

  function newGame() {
    setMoves([])
    setPlayerColour((c) => (c === 'w' ? 'b' : 'w'))
  }

  const status = engineError
    ? engineError
    : outcome
      ? describeOutcome(outcome)
      : opponentToMove
        ? 'Thinking…'
        : `Your move${chess.inCheck() ? ' · check' : ''}`

  return (
    <main className="game-screen">
      <header className="game-header">
        <h1>Test game vs Stockfish</h1>
        <p className="stage-label">
          You play {playerColour === 'w' ? 'White' : 'Black'} · no help yet
        </p>
      </header>

      <p className={outcome ? 'game-status game-over' : 'game-status'}>{status}</p>

      <Board
        fen={fen}
        orientation={playerColour === 'w' ? 'white' : 'black'}
        movableColour={outcome ? null : playerColour}
        lastMove={last ? { from: last.from, to: last.to } : null}
        onMove={addMove}
      />

      <p className="last-move">{last ? `Last move: ${last.san}` : 'Tap a piece, then a square. Or drag.'}</p>

      <div className="game-actions">
        <button type="button" onClick={newGame}>
          New game
        </button>
        <label className="level-picker">
          <span>Opponent</span>
          <select value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            {TEST_OPPONENT_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="build-stamp">Version: {BUILD_LABEL}</p>
    </main>
  )
}
