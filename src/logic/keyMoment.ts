// Key moments (Joseph, Sep 2026): the opponent says something when the next
// move really matters, so the player learns to notice those moments and slow
// down. Never what to play: only that this one is worth a proper look.
//
// A key moment is a position where one move is far better than the rest: the
// only move that holds, or the one move that wins something. Found from the
// engine's top lines for the player (side to move).
import type { Score } from '../engine/uci'
import { winChance } from './evaluation'

/** How much better the best move must be than the next, in winning chances. */
export const KEY_GAP = 0.2
/** Not in the opening, where several moves are usually fine anyway. */
export const KEY_FROM_PLY = 12
/** At most this many a game, this many moves apart. */
export const KEY_LIMIT = 2
export const KEY_GAP_PLIES = 12

export type KeyInputs = {
  /** The engine's lines for the side to move, best first (at least two needed). */
  lines: readonly { score: Score; pv: readonly string[] }[]
  ply: number
  /** The opponent's last move (UCI) and whether it captured: a recapture is obvious, not key. */
  lastMove: { uci: string; captured: boolean } | null
  /** Plies of the key moments already announced this game. */
  earlier: readonly number[]
}

export function isKeyMoment({ lines, ply, lastMove, earlier }: KeyInputs): boolean {
  if (ply < KEY_FROM_PLY || lines.length < 2 || earlier.length >= KEY_LIMIT) return false
  if (earlier.some((p) => ply - p < KEY_GAP_PLIES)) return false
  const [best, second] = lines
  const bestMove = best.pv[0]
  if (!bestMove) return false
  // Taking back what they just took: obvious to anyone, not worth a warning.
  if (lastMove?.captured && bestMove.slice(2, 4) === lastMove.uci.slice(2, 4)) return false
  // Already won or already lost either way: nothing hangs on it.
  const b = winChance(best.score)
  const s = winChance(second.score)
  if (s > 0.9 || b < 0.1) return false
  return b - s >= KEY_GAP
}
