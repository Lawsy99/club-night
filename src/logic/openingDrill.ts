// The opening drill: you play White's moves of a line, Pemberton plays
// Black's. Pure helpers: which moves continue a line, his reply, and the
// principle a wrong move breaks (so the correction teaches something).
import { Chess, type Move } from 'chess.js'
import type { OpeningDrill } from '../data/openingLessons'
import { applyUci } from './game'
import { parseLine } from './openingBook'

const parsedLines = new Map<string, string[][]>()

export function drillLines(drill: OpeningDrill): string[][] {
  let lines = parsedLines.get(drill.id)
  if (!lines) {
    lines = drill.lines.map(parseLine)
    parsedLines.set(drill.id, lines)
  }
  return lines
}

const continuing = (lines: string[][], moves: readonly string[]) =>
  lines.filter((l) => l.length > moves.length && moves.every((m, i) => l[i] === m))

/** The moves (UCI) that carry on one of the lines from here. */
export function expectedMoves(drill: OpeningDrill, moves: readonly string[]): string[] {
  return [...new Set(continuing(drillLines(drill), moves).map((l) => l[moves.length]))]
}

/** Pemberton's reply: one of the lines' next moves, chosen at random. */
export function drillReply(drill: OpeningDrill, moves: readonly string[], random: () => number = Math.random): string | null {
  const options = [...new Set(continuing(drillLines(drill), moves).map((l) => l[moves.length]))]
  return options.length ? options[Math.floor(random() * options.length)] : null
}

/** The line is finished (nothing continues from here). */
export function drillFinished(drill: OpeningDrill, moves: readonly string[]): boolean {
  return continuing(drillLines(drill), moves).length === 0
}

/**
 * Why a move that isn't in the lesson's line is a worse idea, in terms of
 * opening principles. Falls back to pointing at the lesson's move in words.
 */
export function openingAdvice(fen: string, uci: string, movesSoFar: readonly string[], expectedWhy: string | null): string {
  const chess = new Chess(fen)
  const move = applyUci(chess, uci) as Move | null
  if (!move) return 'That isn’t a legal move.'
  const earlier = replayedMoves(movesSoFar)
  const mine = earlier.filter((m) => m.color === move.color)

  if (move.piece === 'q') return 'Not the queen yet: she’ll only be chased about. Get the smaller pieces out first.'
  if (move.piece === 'k' && !move.isKingsideCastle() && !move.isQueensideCastle()) {
    return 'Keep your king at home until you castle.'
  }
  if (!move.captured && mine.some((m) => m.to === move.from)) return 'You’ve already moved that piece. Get a new one out.'
  if (move.piece === 'n' && (move.to[0] === 'a' || move.to[0] === 'h')) {
    return 'A knight on the edge controls far fewer squares. Aim it at the centre.'
  }
  if (move.piece === 'p' && 'abgh'.includes(move.from[0])) {
    return 'Pawns on the edge don’t help yet. The centre and your pieces come first.'
  }
  if (move.piece === 'r') return 'The rooks come out last, once the king has castled.'
  return expectedWhy
    ? `That’s playable, but it’s not tonight’s opening. Think about this: ${expectedWhy.charAt(0).toLowerCase()}${expectedWhy.slice(1)}`
    : 'That’s playable, but it’s not tonight’s opening. Try again.'
}

function replayedMoves(moves: readonly string[]): Move[] {
  const chess = new Chess()
  const out: Move[] = []
  for (const m of moves) {
    const played = applyUci(chess, m)
    if (played) out.push(played as Move)
  }
  return out
}
