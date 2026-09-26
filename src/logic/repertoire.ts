// "Your move" notes from the player's repertoire: while the game is still
// following one of their opening's main lines, which move comes next.
import { findChoice, type Repertoire, type RepertoireSlot } from '../data/repertoire'
import type { Colour } from './game'

export type RepertoireHint = { opening: string; san: string }

const PIECE_NAMES: Record<string, string> = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' }

/** A move in plain words, e.g. "Nf3" → "knight to f3", "exd5" → "pawn takes on d5". */
export function sanInWords(san: string): string {
  const clean = san.replace(/[+#!?]/g, '')
  if (clean === 'O-O') return 'castle kingside'
  if (clean === 'O-O-O') return 'castle queenside'
  const square = clean.match(/([a-h][1-8])(=[QRBN])?$/)?.[1] ?? clean
  const piece = PIECE_NAMES[clean[0]] ?? 'pawn'
  return `${piece} ${clean.includes('x') ? 'takes on' : 'to'} ${square}`
}

/** Which of the player's three choices applies to this game so far. */
export function slotFor(sans: readonly string[], playerColour: Colour): RepertoireSlot | null {
  if (playerColour === 'w') return 'white'
  if (sans[0] === 'e4') return 'vsE4'
  if (sans[0] === 'd4') return 'vsD4'
  return null
}

/**
 * The player's next move in their repertoire, if it's their turn and the
 * game so far matches one of their lines exactly. Null once anyone leaves
 * the book (that's where thinking for yourself starts).
 */
export function repertoireHint(
  sans: readonly string[],
  playerColour: Colour,
  repertoire: Repertoire | undefined,
): RepertoireHint | null {
  if (!repertoire) return null
  const playersTurn = (sans.length % 2 === 0) === (playerColour === 'w')
  if (!playersTurn) return null
  // Black's choice depends on White's first move, so wait for it.
  const slot = slotFor(sans, playerColour)
  if (!slot) return null
  const choice = findChoice(slot, repertoire[slot])
  if (!choice) return null
  for (const line of choice.lines) {
    if (line.length > sans.length && sans.every((m, i) => line[i] === m)) {
      return { opening: choice.name, san: line[sans.length] }
    }
  }
  return null
}
