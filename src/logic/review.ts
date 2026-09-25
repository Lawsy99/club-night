// Post-game review maths: grading every move and working out accuracy.
// Pure functions; the engine work that produces the evaluations lives in
// src/engine/reviewAnalysis.ts.
import { Chess } from 'chess.js'
import { winChance } from './evaluation'
import { applyUci, type Colour } from './game'
import { rateMove, type MoveRating } from './moveRating'

/** The engine's verdict on one position of the game. */
export type PositionEval = {
  /** From White's point of view, in centipawns; mates are ±10,000-ish. */
  cp: number
  /** The engine's choice in this position (UCI), or null if the game is over. */
  bestMove: string | null
}

export type ReviewedMove = {
  ply: number // 0 = White's first move
  mover: Colour
  uci: string
  san: string
  /** Position before the move, so it can be shown again. */
  fenBefore: string
  /** Winning chances (0–1) for the mover, before (with best play) and after. */
  winBefore: number
  winAfter: number
  rating: MoveRating
  bestMove: string | null
  /** 0–100, Lichess-style: how much of the available advantage was kept. */
  accuracy: number
}

const forMover = (cp: number, mover: Colour) => (mover === 'w' ? cp : -cp)
const chanceFor = (cp: number, mover: Colour) => winChance({ type: 'cp', value: forMover(cp, mover) })

/**
 * Lichess's per-move accuracy formula: 100 when nothing is lost, falling
 * steeply as the mover's winning chances (in %) drop.
 */
export function moveAccuracy(winBefore: number, winAfter: number): number {
  const drop = (winBefore - winAfter) * 100
  if (drop <= 0) return 100
  const acc = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669
  return Math.max(0, Math.min(100, acc))
}

/** Grades every move. `evals` has one entry per position: moves.length + 1. */
export function reviewMoves(moves: readonly string[], evals: readonly PositionEval[]): ReviewedMove[] {
  const chess = new Chess()
  return moves.map((uci, ply) => {
    const mover: Colour = ply % 2 === 0 ? 'w' : 'b'
    const fenBefore = chess.fen()
    const san = applyUci(chess, uci)?.san ?? uci
    const before = evals[ply]
    const after = evals[ply + 1]
    const winBefore = chanceFor(before.cp, mover)
    const winAfter = chanceFor(after.cp, mover)
    return {
      ply,
      mover,
      uci,
      san,
      fenBefore,
      winBefore,
      winAfter,
      rating: rateMove({
        bestBefore: { type: 'cp', value: forMover(before.cp, mover) },
        after: { type: 'cp', value: forMover(after.cp, mover) },
        playedBestMove: before.bestMove === uci,
      }),
      bestMove: before.bestMove,
      accuracy: moveAccuracy(winBefore, winAfter),
    }
  })
}

/**
 * One accuracy figure for a side's whole game. Lichess blends an ordinary
 * average with a harmonic mean (which punishes the odd disaster harder);
 * we do the same, without Lichess's extra volatility weighting.
 */
export function gameAccuracy(moves: readonly ReviewedMove[], side: Colour): number | null {
  const accs = moves.filter((m) => m.mover === side).map((m) => m.accuracy)
  if (accs.length === 0) return null
  const mean = accs.reduce((a, b) => a + b, 0) / accs.length
  const harmonic = accs.length / accs.reduce((sum, a) => sum + 1 / Math.max(a, 1), 0)
  return Math.round((mean + harmonic) / 2)
}

export function ratingCounts(moves: readonly ReviewedMove[], side: Colour): Record<MoveRating, number> {
  const counts: Record<MoveRating, number> = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  for (const m of moves) if (m.mover === side) counts[m.rating]++
  return counts
}
