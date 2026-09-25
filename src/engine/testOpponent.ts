// The Phase 1 opponent: Stockfish with its built-in Skill Level weakening,
// plus a short pause so it doesn't reply instantly.
import { TEST_THINK_TIME, type TestOpponentLevel } from '../data/testOpponents'
import { getEngine } from './stockfish'

/** Asks the engine for a move. Resolves with the move in UCI form, or null. */
export async function chooseTestOpponentMove(
  fen: string,
  level: TestOpponentLevel,
): Promise<string | null> {
  const started = Date.now()
  const { bestMove } = await getEngine().search(fen, {
    skillLevel: level.skillLevel,
    depth: level.depth,
    movetime: level.movetime,
  })

  const { min, max } = TEST_THINK_TIME
  const thinkTime = min + Math.random() * (max - min)
  const remaining = thinkTime - (Date.now() - started)
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
  return bestMove
}
