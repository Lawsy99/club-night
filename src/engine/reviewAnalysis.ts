// Analyses every position of a finished game for the review, in the
// background engine. Depth is capped so a whole game finishes in well under
// a minute on a phone (roughly a third of a second per position).
import { Chess } from 'chess.js'
import { toCentipawns } from '../logic/evaluation'
import { applyUci, getOutcome } from '../logic/game'
import { PV_KEPT, type PositionEval } from '../logic/review'
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
    evals.push(await evaluateWithRetries(fen))
    onProgress(evals.length, fens.length)
  }
  return evals
}

/** Tries each position a few times before giving up. */
const ATTEMPTS = 3

/**
 * An iPhone can pause the engine (screen locked, app in the background), and
 * the engine is then treated as broken. Rather than failing the whole review,
 * try that position again: getEngine() starts a fresh engine, and the review
 * carries on from where it got to (Joseph, Sep 2026: "the analysis couldn't run").
 */
async function evaluateWithRetries(fen: string): Promise<PositionEval> {
  let lastError: unknown = null
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      return await evaluate(fen)
    } catch (err) {
      lastError = err
      // A moment's pause lets the phone settle before a fresh engine starts.
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  throw lastError
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
  const pv = top?.pv.slice(0, PV_KEPT)
  return { cp: position.turn() === 'w' ? cpForMover : -cpForMover, bestMove, ...(pv?.length ? { pv } : {}) }
}
