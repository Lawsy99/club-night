// Playing from a character's opening book: while the game so far matches the
// start of one of their lines, they play that line's next move.
import { Chess } from 'chess.js'
import { OPENING_BOOKS } from '../data/openingBooks'
import { toUci, type Colour } from './game'
import { detectOpening } from './openings'

/** "1. e4 e5 2. Nf3" → ["e2e4", "e7e5", "g1f3"]. Throws on an illegal move. */
export function parseLine(line: string): string[] {
  const chess = new Chess()
  return sanTokens(line).map((san) => toUci(chess.move(san)))
}

function sanTokens(line: string): string[] {
  return line.split(/\s+/).filter((token) => token && !/^\d+\.+$/.test(token))
}

type BookLine = { moves: string[]; opening: string | null }

// Parsed once: character → colour → lines (moves, plus which opening family).
const parsed = new Map<string, Record<Colour, BookLine[]>>()
function linesFor(characterId: string): Record<Colour, BookLine[]> | null {
  const book = OPENING_BOOKS[characterId]
  if (!book) return null
  let lines = parsed.get(characterId)
  if (!lines) {
    const toLine = (l: string): BookLine => ({ moves: parseLine(l), opening: detectOpening(sanTokens(l)) })
    lines = { w: book.white.map(toLine), b: book.black.map(toLine) }
    parsed.set(characterId, lines)
  }
  return lines
}

/**
 * The character's next book move, or null once the game has left their book.
 * When several lines continue differently, one is picked at random (lines
 * that share a move make it proportionally likelier). With `prefer`, lines
 * heading into that opening are chosen when there are any: Toby's targeting.
 */
export function bookMove(
  characterId: string,
  characterColour: Colour,
  movesSoFar: readonly string[],
  random: () => number = Math.random,
  prefer?: string,
): string | null {
  const lines = linesFor(characterId)?.[characterColour]
  if (!lines) return null
  const continuing = lines.filter(
    (line) => line.moves.length > movesSoFar.length && movesSoFar.every((m, i) => line.moves[i] === m),
  )
  const preferred = prefer ? continuing.filter((l) => l.opening === prefer) : []
  const options = (preferred.length ? preferred : continuing).map((line) => line.moves[movesSoFar.length])
  if (options.length === 0) return null
  return options[Math.floor(random() * options.length)]
}
