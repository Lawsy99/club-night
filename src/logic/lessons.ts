// Turning a lesson's bubbles into board positions: each bubble's moves play
// on from the previous bubble's position.
import { Chess } from 'chess.js'
import type { LessonBubble } from '../data/lessons'

export type LessonFrame = {
  text: string
  fen: string
  /** The last move played on the board for this bubble, for highlighting. */
  lastMove: { from: string; to: string } | null
}

/**
 * Plays through the bubbles. Moves may start mid-line ("3... c5"): the move
 * numbers are just for reading, the moves themselves carry on in order.
 */
export function lessonFrames(bubbles: readonly LessonBubble[]): LessonFrame[] {
  const chess = new Chess()
  let last: { from: string; to: string } | null = null
  return bubbles.map((b) => {
    if (b.moves) {
      for (const san of sanTokens(b.moves)) {
        const move = chess.move(san)
        last = { from: move.from, to: move.to }
      }
    }
    return { text: b.text, fen: chess.fen(), lastMove: last }
  })
}

/** "3... c5 4. c3 Nc6" → ["c5", "c3", "Nc6"]. */
function sanTokens(line: string): string[] {
  return line.split(/\s+/).filter((t) => t && !/^\d+\.+$/.test(t))
}
