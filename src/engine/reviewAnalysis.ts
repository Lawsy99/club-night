// Analyses every position of a finished game for the review, in the
// background engine. Depth is capped so a whole game finishes in well under
// a minute on a phone (roughly a third of a second per position).
import { Chess } from 'chess.js'
import { toCentipawns } from '../logic/evaluation'
import { applyUci, getOutcome } from '../logic/game'
import type { PositionEval } from '../logic/review'
import { getEngine } from './stockfish'

const REVIEW_LIMITS = { depth: 14, movetime: 350 }
const MATE_CP = 10_000

export async function analyseGame(
  moves: readonly string[],
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean,
): Promise<PositionEval[] | null> {
  const chess = new Chess()
  const fens = [chess.fen()]
  for (const uci of moves) {
    applyUci(chess, uci)
    fens.push(chess.fen())
  }

  const evals: PositionEval[] = []
  for (const fen of fens) {
    if (isCancelled()) return null
    evals.push(await evaluate(fen))
    onProgress(evals.length, fens.length)
  }
  return evals
}

async function evaluate(fen: string): Promise<PositionEval> {
  const position = new Chess(fen)
  const outcome = getOutcome(position)
  if (outcome) {
    // Nothing to search: checkmate is decisive, any other ending is level.
    if (outcome.reason === 'checkmate') {
      return { cp: position.turn() === 'w' ? -MATE_CP : MATE_CP, bestMove: null }
    }
    return { cp: 0, bestMove: null }
  }
  const { bestMove, lines } = await getEngine().search(fen, REVIEW_LIMITS)
  const top = lines[0]
  const cpForMover = top ? toCentipawns(top.score) : 0
  return { cp: position.turn() === 'w' ? cpForMover : -cpForMover, bestMove }
}
