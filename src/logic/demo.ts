// Building demonstrations for the DemoBoard: from lines written in ordinary
// notation (scouting reports), or from a real puzzle (lessons).
import { Chess } from 'chess.js'
import type { DemoStep } from '../components/DemoBoard'
import { toUci } from './game'
import type { Puzzle } from './puzzles'

export type WrittenStep = { caption: string; moves?: string; arrow?: string }

/**
 * Written steps → demo steps. Each step's moves ("3... c5 4. c3") carry on
 * from the step before; move numbers are only for reading. An `arrow` is a
 * move in ordinary notation to point at, from the resulting position.
 * Throws on an illegal move, so tests catch mistakes in the content.
 */
export function buildDemo(steps: readonly WrittenStep[], startFen?: string): DemoStep[] {
  const chess = new Chess(startFen)
  return steps.map((s) => {
    const moves = (s.moves ?? '')
      .split(/\s+/)
      .filter((t) => t && !/^\d+\.+$/.test(t))
      .map((san) => toUci(chess.move(san)))
    let arrow: DemoStep['arrow']
    if (s.arrow) {
      const m = new Chess(chess.fen()).move(s.arrow)
      arrow = { from: m.from, to: m.to, colour: 'rgba(40, 120, 200, 0.9)' }
    }
    return { caption: s.caption, moves, arrow }
  })
}

/** A puzzle played out as an example: the setup move, then the solution. */
export function puzzleDemo(p: Puzzle, intro: string, caption: string): DemoStep[] {
  return [
    { caption: intro, moves: [p.moves[0]] },
    { caption, moves: p.moves.slice(1) },
  ]
}
