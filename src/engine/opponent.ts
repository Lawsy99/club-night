// Chooses the opponent's move: the custom low-rated bot below 800, Maia-3
// from 800 up. Adds a short human-like pause either way.
import { Chess } from 'chess.js'
import { TEST_THINK_TIME, type TestOpponentLevel } from '../data/testOpponents'
import { botDepth, pickBotMove } from '../logic/botMistakeModel'
import { toCentipawns } from '../logic/evaluation'
import { sampleMove } from '../logic/sampleMove'
import { getMaia } from './maia/maia'
import { getEngine } from './stockfish'

export type OpponentChoice = {
  move: string | null
  /** How long Maia's model took, when Maia played (for checking phone speed). */
  maiaMs?: number
}

export async function chooseOpponentMove(fen: string, level: TestOpponentLevel): Promise<OpponentChoice> {
  const started = Date.now()
  const choice = level.engine === 'maia' ? await maiaMove(fen, level.rating) : await botMove(fen, level.rating)

  const { min, max } = TEST_THINK_TIME
  const remaining = min + Math.random() * (max - min) - (Date.now() - started)
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
  return choice
}

async function maiaMove(fen: string, rating: number): Promise<OpponentChoice> {
  // Until player ratings exist (Phase 4), assume an evenly matched opponent.
  const { policy, ms } = await getMaia().predict(fen, rating, rating)
  return { move: sampleMove(policy), maiaMs: ms }
}

async function botMove(fen: string, rating: number): Promise<OpponentChoice> {
  const { lines } = await getEngine().search(fen, { depth: botDepth(rating), multiPv: 6, movetime: 400 })
  const candidates = lines.map((l) => ({ move: l.pv[0], cp: toCentipawns(l.score) }))
  const legal = new Chess(fen).moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''))
  return { move: pickBotMove(candidates, legal, rating) }
}
