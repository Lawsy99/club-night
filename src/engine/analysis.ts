// Full-strength analysis of a position, shared by the evaluation bar, hints,
// the best-line panel and the blunder warning. Results are remembered, so the
// same position is never analysed twice.
import { Chess } from 'chess.js'
import type { Colour } from '../logic/game'
import { getEngine } from './stockfish'
import type { Score } from './uci'

export type Analysis = {
  fen: string
  sideToMove: Colour
  /** From the side-to-move's point of view. */
  score: Score
  bestMove: string | null
  /** The engine's expected continuation, in UCI, starting with bestMove. */
  pv: string[]
}

// Capped so a phone stays responsive and the battery lasts: about half a
// second per position, which is plenty for help features.
const LIMITS = { depth: 16, movetime: 500 }
const MAX_REMEMBERED = 300

const cache = new Map<string, Promise<Analysis | null>>()

/** Analyses a position. Resolves null for finished games (nothing to analyse). */
export function analysePosition(fen: string): Promise<Analysis | null> {
  const known = cache.get(fen)
  if (known) return known

  const chess = new Chess(fen)
  const result: Promise<Analysis | null> = chess.isGameOver()
    ? Promise.resolve(null)
    : getEngine()
        .search(fen, LIMITS)
        .then(({ bestMove, lines }) => {
          const top = lines[0]
          if (!top) return null
          return { fen, sideToMove: chess.turn(), score: top.score, bestMove, pv: top.pv }
        })

  // Forget failures so they can be retried; forget the oldest when full.
  result.catch(() => cache.delete(fen))
  cache.set(fen, result)
  if (cache.size > MAX_REMEMBERED) cache.delete(cache.keys().next().value!)
  return result
}
