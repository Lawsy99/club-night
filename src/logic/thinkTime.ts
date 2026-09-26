// How long an opponent appears to think before moving (design document,
// "How long bots take to move", untimed games). The engine answers almost
// instantly; this is the human-like pause on top.
//
// Revised Sep 2026 (Joseph): everyone plays quicker. Obvious moves, forced
// moves and recaptures are near-instant; only genuinely hard positions get a
// real think. Waiting around is not the same as feeling human.

export type MoveKind = 'forced' | 'book' | 'obvious' | 'normal' | 'complex'

const RANGES_MS: Record<MoveKind, [number, number]> = {
  forced: [150, 400],
  book: [600, 1800],
  obvious: [300, 1200],
  normal: [1800, 5000],
  complex: [4500, 9000],
}

/**
 * Classifies a move from how sure a human would be: `topChance` is the
 * likelihood of the most popular move (from Maia), so a near-certain move is
 * "obvious" and a spread of options is "complex". Only one legal move is
 * "forced": no one thinks about that.
 */
export function classifyMove(topChance: number, isRecapture: boolean, legalMoves = 2): MoveKind {
  if (legalMoves <= 1) return 'forced'
  if (isRecapture || topChance >= 0.5) return 'obvious'
  if (topChance < 0.2) return 'complex'
  return 'normal'
}

/** A pause in milliseconds, scaled by the character's pace (below 1 is quicker). */
export function thinkTime(kind: MoveKind, pace: number, random: () => number = Math.random): number {
  const [min, max] = RANGES_MS[kind]
  // Forced moves ignore pace: even Priya doesn't ponder her only move.
  const scale = kind === 'forced' ? 1 : pace
  return Math.round((min + random() * (max - min)) * scale)
}
