// Turning engine scores into things people understand: who's better, by how
// much, and how likely they are to win.
import type { Score } from '../engine/uci'
import type { Colour } from './game'

/** Stand-in value for a forced mate, well beyond any real advantage. */
const MATE_CP = 10_000

/** Flips a score to the other side's point of view. */
export function flipScore(score: Score): Score {
  return { type: score.type, value: -score.value }
}

/** A score from the side-to-move's view, turned into the given colour's view. */
export function scoreFor(colour: Colour, sideToMove: Colour, score: Score): Score {
  return colour === sideToMove ? score : flipScore(score)
}

/**
 * Centipawns (100 = one pawn), with mates as huge numbers. A quicker mate
 * counts as slightly bigger, so "mate in 2" beats "mate in 5".
 */
export function toCentipawns(score: Score): number {
  if (score.type === 'cp') return score.value
  if (score.value === 0) return -MATE_CP // side to move is already mated
  return Math.sign(score.value) * (MATE_CP - Math.abs(score.value))
}

/**
 * Chance of winning, 0 to 1, for the side the score belongs to. This is the
 * curve Lichess uses; it flattens out, so +9 and +12 both read as "winning".
 */
export function winChance(score: Score): number {
  const cp = Math.max(-1000, Math.min(1000, toCentipawns(score)))
  return 1 / (1 + Math.exp(-0.00368208 * cp))
}

/**
 * Formats a stored centipawn value (mates stored as ±(10,000 − moves), see
 * toCentipawns), e.g. "+1.4" or "M3".
 */
export function formatCp(cp: number): string {
  if (Math.abs(cp) >= MATE_CP - 100) {
    const moves = MATE_CP - Math.abs(cp)
    return formatScore({ type: 'mate', value: moves === 0 ? 0 : Math.sign(cp) * moves })
  }
  return formatScore({ type: 'cp', value: cp })
}

/** "+1.4", "−0.3", "M3", "−M2" — the usual way to show an evaluation. */
export function formatScore(score: Score): string {
  if (score.type === 'mate') {
    if (score.value === 0) return '#'
    return `${score.value < 0 ? '−' : ''}M${Math.abs(score.value)}`
  }
  const pawns = score.value / 100
  if (Math.abs(pawns) < 0.05) return '0.0'
  return `${pawns > 0 ? '+' : '−'}${Math.abs(pawns).toFixed(1)}`
}
