// Strength levels for the test opponent, by rating. Below 800 a custom
// Stockfish-based bot with a human mistake model plays; from 800 up, Maia-3
// (see the design document, "Which engine plays"). Temporary: the characters
// replace this list, and the picker goes with the test screen in Phase 4.

export type TestOpponentLevel = {
  id: string
  label: string
  /** Playing strength, on the Lichess-style rating scale. */
  rating: number
  engine: 'bot' | 'maia'
}

export const TEST_OPPONENT_LEVELS: TestOpponentLevel[] = [
  { id: 'beginner', label: 'Beginner', rating: 400, engine: 'bot' },
  { id: 'novice', label: 'Novice', rating: 600, engine: 'bot' },
  { id: 'casual', label: 'Casual', rating: 800, engine: 'maia' },
  { id: 'improver', label: 'Improver', rating: 1000, engine: 'maia' },
  { id: 'club', label: 'Club player', rating: 1200, engine: 'maia' },
  { id: 'strong', label: 'Strong club player', rating: 1500, engine: 'maia' },
  { id: 'expert', label: 'Expert', rating: 1800, engine: 'maia' },
  { id: 'master', label: 'Master', rating: 2200, engine: 'maia' },
]

export const DEFAULT_TEST_LEVEL_ID = 'casual'

export function findLevel(id: string): TestOpponentLevel {
  return TEST_OPPONENT_LEVELS.find((l) => l.id === id) ?? TEST_OPPONENT_LEVELS[2]
}

/**
 * How long the opponent seems to think before moving, in milliseconds.
 * The characters' own human-like timings replace this later in Phase 3.
 */
export const TEST_THINK_TIME = { min: 700, max: 1500 }
