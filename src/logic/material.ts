// Captured pieces and material balance, for the player strips above and
// below the board (as chess.com and Lichess show them).
import type { PieceSymbol } from 'chess.js'
import type { Colour } from './game'

const START: Record<Exclude<PieceSymbol, 'k'>, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }
const VALUE: Record<Exclude<PieceSymbol, 'k'>, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }
const ORDER: Exclude<PieceSymbol, 'k'>[] = ['q', 'r', 'b', 'n', 'p']

export type MaterialSummary = {
  /** Pieces this side has taken from the opponent, most valuable first. */
  captured: PieceSymbol[]
  /** Points ahead (positive) in the usual 1/3/3/5/9 counting; 0 if level or behind. */
  lead: number
}

/** Counts from the piece-placement part of a FEN. Promotions can make counts exceed the start. */
export function materialFor(fen: string, side: Colour): MaterialSummary {
  const placement = fen.split(' ')[0]
  const count = (c: string) => [...placement].filter((x) => x === c).length
  const opponent = side === 'w' ? 'b' : 'w'
  const piecesOf = (colour: Colour, p: string) => count(colour === 'w' ? p.toUpperCase() : p)

  const captured: PieceSymbol[] = []
  let mine = 0
  let theirs = 0
  for (const p of ORDER) {
    const missing = Math.max(0, START[p] - piecesOf(opponent, p))
    for (let i = 0; i < missing; i++) captured.push(p)
    mine += piecesOf(side, p) * VALUE[p]
    theirs += piecesOf(opponent, p) * VALUE[p]
  }
  return { captured, lead: Math.max(0, mine - theirs) }
}
