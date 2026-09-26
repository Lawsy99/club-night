// The player's repertoire, worked out from their own games, and "your move"
// notes: while a game is still following one of their opening's main lines,
// which move comes next.
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
 * Which of the repertoire openings a game was, from the player's own first
 * moves (revised Sep 2026, Joseph: worked out from the games, never asked).
 */
export function openingPlayed(sans: readonly string[], playerColour: Colour): { slot: RepertoireSlot; id: string } | null {
  if (playerColour === 'w') {
    if (sans[0] === 'e4' && sans[4] === 'Bc4') return { slot: 'white', id: 'italian' }
    if (sans[0] === 'd4' && sans[2] === 'Bf4') return { slot: 'white', id: 'london' }
    if (sans[0] === 'd4' && sans[2] === 'c4') return { slot: 'white', id: 'queens-gambit' }
    return null
  }
  if (sans[0] === 'e4') {
    const reply = { c5: 'sicilian', c6: 'caro-kann', e5: 'e5' }[sans[1] ?? '']
    return reply ? { slot: 'vsE4', id: reply } : null
  }
  if (sans[0] === 'd4') {
    if (sans[1] === 'Nf6' && sans[3] === 'g6') return { slot: 'vsD4', id: 'kid' }
    if (sans[1] === 'd5' && sans[3] === 'e6') return { slot: 'vsD4', id: 'qgd' }
    if (sans[1] === 'd5' && sans[2] === 'Bf4') return { slot: 'vsD4', id: 'qgd' } // against the London
  }
  return null
}

/** A choice needs this many games before notes start following it. */
export const REPERTOIRE_MIN_GAMES = 2

/** The player's usual opening in each situation, from their recent games (most played wins). */
export function inferRepertoire(
  games: readonly { sans: readonly string[]; playerColour: Colour }[],
): Partial<Repertoire> {
  const counts = new Map<string, number>()
  for (const g of games) {
    const played = openingPlayed(g.sans, g.playerColour)
    if (played) counts.set(`${played.slot}:${played.id}`, (counts.get(`${played.slot}:${played.id}`) ?? 0) + 1)
  }
  const result: Partial<Repertoire> = {}
  for (const slot of ['white', 'vsE4', 'vsD4'] as RepertoireSlot[]) {
    let best: [string, number] | null = null
    for (const [key, n] of counts) {
      const [s, id] = key.split(':')
      if (s === slot && n >= REPERTOIRE_MIN_GAMES && (!best || n > best[1])) best = [id, n]
    }
    if (best) result[slot] = best[0]
  }
  return result
}

/**
 * The player's next move along one given line (e.g. the one Pemberton showed
 * in the scouting report), if it's their turn and the game still follows it.
 */
export function nextInLine(sans: readonly string[], playerColour: Colour, line: readonly string[]): string | null {
  const playersTurn = (sans.length % 2 === 0) === (playerColour === 'w')
  if (!playersTurn || line.length <= sans.length) return null
  return sans.every((m, i) => line[i] === m) ? line[sans.length] : null
}

/**
 * The player's next move in their repertoire, if it's their turn and the
 * game so far matches one of their lines exactly. Null once anyone leaves
 * the book (that's where thinking for yourself starts).
 */
export function repertoireHint(
  sans: readonly string[],
  playerColour: Colour,
  repertoire: Partial<Repertoire> | undefined,
): RepertoireHint | null {
  if (!repertoire) return null
  const playersTurn = (sans.length % 2 === 0) === (playerColour === 'w')
  if (!playersTurn) return null
  // Black's choice depends on White's first move, so wait for it.
  const slot = slotFor(sans, playerColour)
  const id = slot ? repertoire[slot] : undefined
  if (!slot || !id) return null
  const choice = findChoice(slot, id)
  if (!choice) return null
  for (const line of choice.lines) {
    if (line.length > sans.length && sans.every((m, i) => line[i] === m)) {
      return { opening: choice.name, san: line[sans.length] }
    }
  }
  return null
}
