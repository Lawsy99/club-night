// How moves are written for the player (Joseph, Sep 2026: beginners don't
// read "Nd3" yet). Below WORDS_BELOW rating, the coach says "the knight move
// to d3" instead; from there up, the usual notation. One setting for the whole
// app, set from the player's rating (AppFlow), so every explanation, heading
// and hint agrees. The compact move list stays in notation either way.
import { Chess, type Move, type PieceSymbol } from 'chess.js'
import { applyUci } from './game'

export type NotationStyle = 'san' | 'words'

/** Below this rating, moves are written in words. */
export const WORDS_BELOW = 1500

let style: NotationStyle = 'san'

export function setNotationStyle(next: NotationStyle): void {
  style = next
}

export function notationStyle(): NotationStyle {
  return style
}

export function styleForRating(rating: number | null | undefined): NotationStyle {
  return rating !== null && rating !== undefined && rating >= WORDS_BELOW ? 'san' : 'words'
}

const PIECES: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

/**
 * A move as a name, for use inside a sentence: "Nd3", or in words "the
 * knight move to d3", "the queen capture on g5", "the rook check on e8",
 * "castling kingside". Start a sentence with `startWith(...)`.
 */
export function moveName(m: Move): string {
  if (style === 'san') return m.san
  if (m.isKingsideCastle()) return 'castling kingside'
  if (m.isQueensideCastle()) return 'castling queenside'
  const piece = PIECES[m.piece]
  const mate = m.san.endsWith('#')
  const check = m.san.endsWith('+')
  const promo = m.promotion ? `, making a ${PIECES[m.promotion]}` : ''
  const base = m.captured ? `the ${piece} capture on ${m.to}` : check || mate ? `the ${piece} check on ${m.to}` : `the ${piece} move to ${m.to}`
  const withCheck = m.captured && (check || mate) ? `${base}, with check` : base
  return `${withCheck}${promo}`
}

/** A move as a step in a line: "queen to h6 with check", "knight takes on h5, checkmate". */
export function moveStep(m: Move): string {
  if (style === 'san') return m.san
  if (m.isKingsideCastle()) return 'castles kingside'
  if (m.isQueensideCastle()) return 'castles queenside'
  const piece = PIECES[m.piece]
  const verb = m.captured ? `${piece} takes on ${m.to}` : `${piece} to ${m.to}`
  const promo = m.promotion ? `, making a ${PIECES[m.promotion]}` : ''
  const end = m.san.endsWith('#') ? ', checkmate' : m.san.endsWith('+') ? ' with check' : ''
  return `${verb}${promo}${end}`
}

/** A line of moves: "Qh6+ Nh5 Qxh5#", or in words "queen to h6 with check, knight to h5, then queen takes on h5, checkmate". */
export function lineText(moves: readonly Move[]): string {
  if (style === 'san') return moves.map((m) => m.san).join(' ')
  const steps = moves.map(moveStep)
  return steps.length <= 1 ? (steps[0] ?? '') : `${steps.slice(0, -1).join(', ')}, then ${steps.at(-1)}`
}

/** The name of a move given as UCI in a position (null if it isn't legal there). */
export function nameOf(fen: string, uci: string): string | null {
  const m = applyUci(new Chess(fen), uci)
  return m ? moveName(m) : null
}

/** The piece a move is made with, in words ("queen"), for "take back with your queen". */
export function pieceOf(fen: string, uci: string): string | null {
  const m = applyUci(new Chess(fen), uci)
  return m ? PIECES[m.piece] : null
}

/** At the start of a sentence: "The knight move to d3…" (notation is left alone: "e4", not "E4"). */
export function startWith(name: string): string {
  return style === 'words' ? name.charAt(0).toUpperCase() + name.slice(1) : name
}

/** Mid-sentence, after "Instead, ": lower the first letter of a words sentence. */
export function continueWith(sentence: string): string {
  return style === 'words' ? sentence.charAt(0).toLowerCase() + sentence.slice(1) : sentence
}

/** A move heading: "14. Bxf7??" or in words "Move 14: the bishop capture on f7 ??". */
export function moveHeading(ply: number, m: Move, glyph: string): string {
  const number = Math.floor(ply / 2) + 1
  if (style === 'san') return m.color === 'w' ? `${number}. ${m.san}${glyph}` : `${number}… ${m.san}${glyph}`
  return `Move ${number}: ${startWith(moveName(m))}${glyph ? ` ${glyph}` : ''}`
}
