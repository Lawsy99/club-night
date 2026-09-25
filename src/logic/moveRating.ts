// Grading a single move, the way Lichess does: by how much the mover's
// winning chances dropped compared with the best move available. The same
// grader will drive the post-game review in Phase 2.
import type { Score } from '../engine/uci'
import { winChance } from './evaluation'

export type MoveRating = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

/**
 * Lichess's thresholds are 0.1 / 0.2 / 0.3 on a −1 to +1 winning-chances
 * scale; our win chance runs 0 to 1, so they halve.
 */
const THRESHOLDS = { inaccuracy: 0.05, mistake: 0.1, blunder: 0.15 }

export type RatingInput = {
  /** The best the mover could have done, from their point of view. */
  bestBefore: Score
  /** The position after their move, from their point of view. */
  after: Score
  /** True if they played exactly the engine's top choice. */
  playedBestMove: boolean
}

export function rateMove({ bestBefore, after, playedBestMove }: RatingInput): MoveRating {
  if (playedBestMove) return 'best'
  const drop = winChance(bestBefore) - winChance(after)
  if (drop >= THRESHOLDS.blunder) return 'blunder'
  if (drop >= THRESHOLDS.mistake) return 'mistake'
  if (drop >= THRESHOLDS.inaccuracy) return 'inaccuracy'
  // Engines often rate several moves almost equally; near-zero loss is "best" too.
  return drop <= 0.01 ? 'best' : 'good'
}

/** Standard chess annotation marks, shown after the move (e.g. "Ng5??"). */
export const RATING_GLYPHS: Record<MoveRating, string> = {
  best: '',
  good: '',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
}

export const RATING_LABELS: Record<MoveRating, string> = {
  best: 'Best move',
  good: 'Good',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
}
