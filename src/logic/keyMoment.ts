// Key moments (Joseph, Sep 2026): the opponent says something when the next
// move really matters, so the player learns to notice those moments and slow
// down. Never what to play: only that this one is worth a proper look.
//
// A key moment is a narrow position: only a few moves are good (at most
// three), and most of the rest are blunders. That covers the only move that
// holds, the one move that wins something, and the position where two or
// three moves are fine and almost anything else loses. Found from the
// engine's top lines for the player (side to move).
import type { Score } from '../engine/uci'
import { winChance } from './evaluation'

/** How many of the engine's best lines to look at. */
export const KEY_LINES = 8
/** A good move: this close to the best, in winning chances. */
export const GOOD_WITHIN = 0.07
/** A blunder: at least this much worse than the best. */
export const BLUNDER_DROP = 0.2
/** At most this many good moves for it to count as narrow. */
export const MAX_GOOD = 3
/** At least this share of all legal moves are blunders (and at least MIN_BLUNDERS of them). */
export const BLUNDER_SHARE = 0.5
export const MIN_BLUNDERS = 4
/** Not in the opening, where several moves are usually fine anyway. */
export const KEY_FROM_PLY = 12
/** At most this many a game, this many moves apart. */
export const KEY_LIMIT = 2
export const KEY_GAP_PLIES = 12

export type KeyInputs = {
  /** The engine's lines for the side to move, best first (up to KEY_LINES). */
  lines: readonly { score: Score; pv: readonly string[] }[]
  /** How many legal moves the player has. */
  legalMoves: number
  ply: number
  /** The opponent's last move (UCI) and whether it captured: a recapture is obvious, not key. */
  lastMove: { uci: string; captured: boolean } | null
  /** Plies of the key moments already announced this game. */
  earlier: readonly number[]
}

export function isKeyMoment({ lines, legalMoves, ply, lastMove, earlier }: KeyInputs): boolean {
  if (ply < KEY_FROM_PLY || lines.length < 2 || earlier.length >= KEY_LIMIT) return false
  if (earlier.some((p) => ply - p < KEY_GAP_PLIES)) return false
  const bestMove = lines[0].pv[0]
  if (!bestMove) return false
  // Taking back what they just took: obvious to anyone, not worth a warning.
  if (lastMove?.captured && bestMove.slice(2, 4) === lastMove.uci.slice(2, 4)) return false

  const chances = lines.map((l) => winChance(l.score))
  const best = chances[0]
  // Already won or already lost whatever you play: nothing hangs on it.
  if (best < 0.1 || chances[1] > 0.9) return false

  const good = chances.filter((c) => best - c <= GOOD_WITHIN).length
  if (good > MAX_GOOD) return false
  // The first line that's a blunder; every move not in the list is worse still.
  const firstBlunder = chances.findIndex((c) => best - c >= BLUNDER_DROP)
  if (firstBlunder === -1) return false
  const blunders = legalMoves - firstBlunder
  return blunders >= MIN_BLUNDERS && blunders >= legalMoves * BLUNDER_SHARE
}
