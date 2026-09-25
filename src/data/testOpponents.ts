// Strength levels for the Phase 1 test opponent (plain Stockfish).
// Temporary: replaced by the real characters and their mistake model in
// Phase 3, and the level picker goes with the test screen in Phase 4.

export type TestOpponentLevel = {
  id: string
  label: string
  /** Stockfish's own weakening setting, 0 (weakest) to 20 (full strength). */
  skillLevel: number
  /** Search limits: lower means weaker and quicker. */
  depth?: number
  movetime: number
}

export const TEST_OPPONENT_LEVELS: TestOpponentLevel[] = [
  { id: 'beginner', label: 'Beginner', skillLevel: 0, depth: 1, movetime: 100 },
  { id: 'casual', label: 'Casual', skillLevel: 3, depth: 3, movetime: 200 },
  { id: 'club', label: 'Club player', skillLevel: 8, depth: 6, movetime: 300 },
  { id: 'strong', label: 'Strong', skillLevel: 14, depth: 10, movetime: 600 },
  { id: 'full', label: 'Full strength', skillLevel: 20, movetime: 1000 },
]

export const DEFAULT_TEST_LEVEL_ID = 'casual'

/**
 * How long the opponent seems to think before moving, in milliseconds.
 * Just enough that replies don't feel instant; the design document's
 * human-like timings arrive with the characters in Phase 3.
 */
export const TEST_THINK_TIME = { min: 700, max: 1500 }
