// Deciding whether a move deserves a blunder warning, and what to say.
import type { BlunderWarningRule } from '../data/helpStages'
import type { Score } from '../engine/uci'
import { toCentipawns } from './evaluation'
import { describeGain, followLine } from './lineFacts'

/**
 * Advantages are capped here before comparing, so going from +15 to +12
 * (still totally winning) doesn't count as "giving away 3 pawns".
 */
const CAP_CP = 1000

export type MoveCheck = {
  /** The best the player could have done, from their point of view. */
  bestBefore: Score
  /** How good the position is after their move, from their point of view. */
  after: Score
}

export type BlunderKind = 'allows-mate' | 'loses-material'

export function assessMove(check: MoveCheck, rule: BlunderWarningRule | null): BlunderKind | null {
  if (!rule) return null
  const { bestBefore, after } = check

  // Walking into a forced mate that wasn't already coming.
  const mateAgainstAfter = after.type === 'mate' && after.value <= 0
  const mateAgainstBefore = bestBefore.type === 'mate' && bestBefore.value <= 0
  if (rule.allowsMate && mateAgainstAfter && !mateAgainstBefore) return 'allows-mate'

  const cap = (s: Score) => Math.max(-CAP_CP, Math.min(CAP_CP, toCentipawns(s)))
  const loss = cap(bestBefore) - cap(after)
  return loss >= rule.minLossCp ? 'loses-material' : null
}


/**
 * The warning text. `fenBefore` is the position before the player's move,
 * `uci` the move, and `replyLine` the engine's best answer to it and what
 * follows (UCI). What's at stake is named only if the line really loses it
 * once the exchanges are done (Sep 2026: a trade isn't "letting them take" a piece).
 */
export function describeBlunder(kind: BlunderKind, fenBefore: string, uci: string, replyLine: readonly string[]): string {
  if (kind === 'allows-mate') return 'That allows a forced checkmate.'
  if (replyLine.length) {
    const line = followLine(fenBefore, [uci, ...replyLine])
    const loss = line.net <= -1 ? describeGain(line.lost, line.won, line.mixedMinors) : null
    if (loss) return `That gives away ${loss}.`
  }
  return 'That gives away a lot.'
}
