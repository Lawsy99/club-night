// Which opening family a game is, from its first moves.
import { OPENING_PATTERNS } from '../data/openingPatterns'

/** The opening family from the moves so far (ordinary notation), or null. */
export function detectOpening(sans: readonly string[]): string | null {
  for (const [key, pattern] of OPENING_PATTERNS) {
    if (pattern.length <= sans.length && pattern.every((m, i) => m === '*' || m === sans[i])) return key
  }
  return null
}
