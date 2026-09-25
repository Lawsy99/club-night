// When an opponent offers a draw, accepts one, or resigns (design document,
// "Draw offers, accepting and resigning"). Evaluations are in centipawns
// from the opponent's own point of view (100 = a pawn up).
import type { Character } from '../data/characters'

/** Clearly worse: accepts the player's draw offer / Toby offers one. */
const CLEARLY_WORSE = -150
/** Hopelessly lost: resignation territory. */
const HOPELESS = -600
/** Level enough for Clive to suggest a draw. */
const LEVEL = 50
/** Dead level, for everyone else's rare endgame offers. */
const DEAD_LEVEL = 30

/**
 * Resigns when hopelessly lost for three of its own moves in a row. Oscar
 * gives up at the first hopeless moment; Derek never resigns; Marjorie plays
 * on to checkmate. `recent` holds the latest evaluations, newest last.
 */
export function shouldResign(character: Character | undefined, recent: readonly number[]): boolean {
  const style = character?.resigns ?? 'normal'
  if (style === 'never' || style === 'plays-to-mate') return false
  const needed = style === 'quickly' ? 1 : 3
  const lastFew = recent.slice(-needed)
  return lastFew.length === needed && lastFew.every((cp) => cp <= HOPELESS)
}

/** Accepts the player's draw offer only when clearly worse (Vera and Derek never). */
export function acceptsDraw(character: Character | undefined, evalCp: number): boolean {
  return (character?.acceptsDraws ?? true) && evalCp <= CLEARLY_WORSE
}

export type DrawOfferContext = {
  evalCp: number
  /** Full move number of the position (1 at the start). */
  moveNumber: number
  /** Pieces other than kings and pawns left on the board, both sides. */
  piecesLeft: number
  /** Full move number of this opponent's last offer, if any (no pestering). */
  lastOfferMove?: number
}

export function shouldOfferDraw(character: Character | undefined, c: DrawOfferContext): boolean {
  const since = c.lastOfferMove === undefined ? Infinity : c.moveNumber - c.lastOfferMove
  switch (character?.offersDraw ?? 'rarely') {
    case 'move-12-when-level': // Clive
      return c.moveNumber >= 12 && Math.abs(c.evalCp) <= LEVEL && since >= 10
    case 'when-worse': // Toby: "Draw? Seems a fair result."
      return c.evalCp <= CLEARLY_WORSE && since >= 10
    case 'rarely': // everyone else, in dead-level endgames only
      return c.moveNumber >= 40 && c.piecesLeft <= 4 && Math.abs(c.evalCp) <= DEAD_LEVEL && since >= 15
  }
}

/** Counts knights, bishops, rooks and queens in a FEN's piece placement. */
export function piecesLeft(fen: string): number {
  return [...fen.split(' ')[0]].filter((c) => 'nbrqNBRQ'.includes(c)).length
}
