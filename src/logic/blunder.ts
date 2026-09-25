// Deciding whether a move deserves a blunder warning, and what to say.
import { Chess, type PieceSymbol } from 'chess.js'
import type { BlunderWarningRule } from '../data/helpStages'
import type { Score } from '../engine/uci'
import { toCentipawns } from './evaluation'

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

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

/**
 * The warning text. `fenAfter` is the position after the player's move and
 * `reply` the engine's best answer to it (UCI), used to name what's at stake.
 */
export function describeBlunder(kind: BlunderKind, fenAfter: string, reply: string | null): string {
  if (kind === 'allows-mate') return 'That allows a forced checkmate.'
  if (reply) {
    const chess = new Chess(fenAfter)
    const captured = chess.get(reply.slice(2, 4) as never)
    if (captured && captured.type !== 'k') {
      return `That lets them take your ${PIECE_NAMES[captured.type]}.`
    }
  }
  return 'That gives away a lot.'
}
