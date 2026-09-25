// Playing from a character's opening book: while the game so far matches the
// start of one of their lines, they play that line's next move.
import { Chess } from 'chess.js'
import { OPENING_BOOKS } from '../data/openingBooks'
import { toUci, type Colour } from './game'

/** "1. e4 e5 2. Nf3" → ["e2e4", "e7e5", "g1f3"]. Throws on an illegal move. */
export function parseLine(line: string): string[] {
  const chess = new Chess()
  return line
    .split(/\s+/)
    .filter((token) => token && !/^\d+\.+$/.test(token))
    .map((san) => toUci(chess.move(san)))
}

// Parsed once: character → colour → lines as move lists.
const parsed = new Map<string, Record<Colour, string[][]>>()
function linesFor(characterId: string): Record<Colour, string[][]> | null {
  const book = OPENING_BOOKS[characterId]
  if (!book) return null
  let lines = parsed.get(characterId)
  if (!lines) {
    lines = { w: book.white.map(parseLine), b: book.black.map(parseLine) }
    parsed.set(characterId, lines)
  }
  return lines
}

/**
 * The character's next book move, or null once the game has left their book.
 * When several lines continue differently, one is picked at random (lines
 * that share a move make it proportionally likelier).
 */
export function bookMove(
  characterId: string,
  characterColour: Colour,
  movesSoFar: readonly string[],
  random: () => number = Math.random,
): string | null {
  const lines = linesFor(characterId)?.[characterColour]
  if (!lines) return null
  const options = lines
    .filter((line) => line.length > movesSoFar.length && movesSoFar.every((m, i) => line[i] === m))
    .map((line) => line[movesSoFar.length])
  if (options.length === 0) return null
  return options[Math.floor(random() * options.length)]
}
