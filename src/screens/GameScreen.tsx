// Phase 1 test game against plain Stockfish. The game is saved after every
// move and resumed on launch. Help stages arrive in step 4.
import { useEffect, useMemo, useRef, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { Board } from '../components/Board'
import { DEFAULT_TEST_LEVEL_ID, TEST_OPPONENT_LEVELS } from '../data/testOpponents'
import { chooseTestOpponentMove } from '../engine/testOpponent'
import { describeOutcome, replay, type GameOutcome } from '../logic/game'
import {
  newGameRecord,
  nextPlayerColour,
  outcomeOf,
  withMove,
  withResignation,
  type GameRecord,
} from '../logic/gameRecord'
import { loadCurrentGame, requestPersistentStorage, saveCurrentGame } from '../storage/db'
import './GameScreen.css'

export function GameScreen() {
  // null while the saved game is loading from the device
  const [game, setGame] = useState<GameRecord | null>(null)

  useEffect(() => {
    requestPersistentStorage()
    loadCurrentGame()
      .then((saved) => setGame(saved && isResumable(saved) ? saved : newGameRecord('w', DEFAULT_TEST_LEVEL_ID)))
      .catch(() => setGame(newGameRecord('w', DEFAULT_TEST_LEVEL_ID)))
  }, [])

  // Save after every change, so closing the app loses nothing.
  useEffect(() => {
    if (game) saveCurrentGame(game).catch((err) => console.error('Save failed', err))
  }, [game])

  if (!game) return <main className="game-screen loading">Setting up the board…</main>
  return <TestGame game={game} setGame={setGame} />
}

/** A saved game we can't replay (e.g. from an older version) is discarded. */
function isResumable(game: GameRecord): boolean {
  try {
    outcomeOf(game)
    return true
  } catch {
    return false
  }
}

type TestGameProps = {
  game: GameRecord
  setGame: React.Dispatch<React.SetStateAction<GameRecord | null>>
}

function TestGame({ game, setGame }: TestGameProps) {
  const [engineError, setEngineError] = useState<string | null>(null)
  const level = TEST_OPPONENT_LEVELS.find((l) => l.id === game.levelId) ?? TEST_OPPONENT_LEVELS[0]

  // Everything on screen is derived from the saved game.
  const chess = useMemo(() => replay(game.moves), [game.moves])
  const fen = chess.fen()
  const outcome = outcomeOf(game)
  const last = chess.history({ verbose: true }).at(-1)
  const opponentToMove = !outcome && chess.turn() !== game.playerColour

  const addMove = (uci: string) => setGame((g) => (g ? withMove(g, uci) : g))

  // When it's the opponent's turn (including straight after resuming),
  // ask the engine, in the background, for a move.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- addMove is stable in effect
  }, [opponentToMove, fen, level])

  function startNextGame() {
    setGame(newGameRecord(nextPlayerColour(game), game.levelId))
  }

  const status = engineError
    ? engineError
    : outcome
      ? `${describeOutcome(outcome)} ${resultForPlayer(outcome, game)}`
      : opponentToMove
        ? 'Thinking…'
        : `Your move${chess.inCheck() ? ' · check' : ''}`

  return (
    <main className="game-screen">
      <header className="game-header">
        <h1>Test game vs Stockfish</h1>
        <p className="stage-label">
          You play {game.playerColour === 'w' ? 'White' : 'Black'} · no help yet
        </p>
      </header>

      <p className={outcome ? 'game-status game-over' : 'game-status'}>{status}</p>

      <Board
        fen={fen}
        orientation={game.playerColour === 'w' ? 'white' : 'black'}
        movableColour={outcome ? null : game.playerColour}
        lastMove={last ? { from: last.from, to: last.to } : null}
        onMove={addMove}
      />

      <p className="last-move">{last ? `Last move: ${last.san}` : 'Tap a piece, then a square. Or drag.'}</p>

      <div className="game-actions">
        {outcome ? (
          <button type="button" className="primary" onClick={startNextGame}>
            {outcome.winner === null ? 'Replay' : 'New game'}
          </button>
        ) : (
          <ResignButton onResign={() => setGame((g) => (g ? withResignation(g, g.playerColour) : g))} />
        )}
        <label className="level-picker">
          <span>Opponent</span>
          <select
            value={game.levelId}
            onChange={(e) => setGame((g) => (g ? { ...g, levelId: e.target.value } : g))}
          >
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

function resultForPlayer(outcome: GameOutcome, game: GameRecord): string {
  if (outcome.winner === null) return 'Draws are replayed.'
  return outcome.winner === game.playerColour ? 'You won.' : 'You lost.'
}

/** Two taps to resign, so a stray tap can't end the game. */
function ResignButton({ onResign }: { onResign: () => void }) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function handleClick() {
    if (armed) {
      window.clearTimeout(timer.current)
      onResign()
      return
    }
    setArmed(true)
    // Quietly disarm if the second tap doesn't come.
    timer.current = window.setTimeout(() => setArmed(false), 3000)
  }

  return (
    <button type="button" className={armed ? 'danger' : undefined} onClick={handleClick}>
      {armed ? 'Tap again to resign' : 'Resign'}
    </button>
  )
}
