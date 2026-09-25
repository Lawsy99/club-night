// How long an opponent appears to think before moving (design document,
// "How long bots take to move", untimed games). The engine answers almost
// instantly; this is the human-like pause on top.

export type MoveKind = 'book' | 'obvious' | 'normal' | 'complex'

const RANGES_MS: Record<MoveKind, [number, number]> = {
  book: [2000, 5000],
  obvious: [2000, 4000],
  normal: [5000, 12000],
  complex: [12000, 20000],
}

/**
 * Classifies a move from how sure a human would be: `topChance` is the
 * likelihood of the most popular move (from Maia), so a near-certain move is
 * "obvious" and a spread of options is "complex".
 */
export function classifyMove(topChance: number, isRecapture: boolean): MoveKind {
  if (isRecapture || topChance >= 0.6) return 'obvious'
  if (topChance < 0.2) return 'complex'
  return 'normal'
}

/** A pause in milliseconds, scaled by the character's pace (below 1 is quicker). */
export function thinkTime(kind: MoveKind, pace: number, random: () => number = Math.random): number {
  const [min, max] = RANGES_MS[kind]
  return Math.round((min + random() * (max - min)) * pace)
}
