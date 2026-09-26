// Chooses the opponent's move. Characters first play from their opening
// book; after that (and for practice levels) the custom low-rated bot plays
// below 800 and Maia-3 from 800 up, nudged towards the character's style.
// Then a human-like pause: the design's thinking times for characters, a
// short one for practice levels.
import { Chess } from 'chess.js'
import { TEST_THINK_TIME } from '../data/testOpponents'
import type { Opponent } from '../data/opponents'
import { botDepth, pickBotMove } from '../logic/botMistakeModel'
import { toCentipawns } from '../logic/evaluation'
import { bookMove } from '../logic/openingBook'
import { MIN_LIKELIHOOD, sampleMove } from '../logic/sampleMove'
import { styleWeight } from '../logic/style'
import { classifyMove, thinkTime, type MoveKind } from '../logic/thinkTime'
import { getMaia } from './maia/maia'
import { getEngine } from './stockfish'

export type OpponentChoice = {
  move: string | null
  /** How long Maia's model took, when Maia played (for checking phone speed). */
  maiaMs?: number
}

export async function chooseOpponentMove(
  fen: string,
  movesSoFar: readonly string[],
  opponent: Opponent,
  /** Toby's targeting: prefer book lines heading into this opening. */
  preferOpening?: string,
): Promise<OpponentChoice> {
  const started = Date.now()
  const colour = new Chess(fen).turn()
  const book = opponent.character ? bookMove(opponent.character.id, colour, movesSoFar, Math.random, preferOpening) : null

  let choice: OpponentChoice
  let kind: MoveKind
  if (book) {
    choice = { move: book }
    kind = 'book'
  } else if (opponent.engine === 'maia') {
    ;({ choice, kind } = await maiaMove(fen, opponent, movesSoFar))
  } else {
    ;({ choice, kind } = await botMove(fen, opponent, movesSoFar))
  }

  const pause = opponent.character
    ? thinkTime(kind, opponent.character.thinkSpeed)
    : TEST_THINK_TIME.min + Math.random() * (TEST_THINK_TIME.max - TEST_THINK_TIME.min)
  const remaining = pause - (Date.now() - started)
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
  return choice
}

async function maiaMove(fen: string, opponent: Opponent, moves: readonly string[]) {
  // Until player ratings exist (phase 4), assume an evenly matched opponent.
  const { policy, ms } = await getMaia().predict(fen, opponent.rating, opponent.rating)
  const style = opponent.character?.style
  const nudged = style
    ? policy.map((m) => (m.p >= MIN_LIKELIHOOD ? { ...m, p: m.p * styleWeight(style, fen, m.move) } : m))
    : policy
  const kind = classifyMove(policy[0]?.p ?? 1, isRecaptureAvailable(fen, moves, policy[0]?.move))
  return { choice: { move: sampleMove(nudged), maiaMs: ms }, kind }
}

async function botMove(fen: string, opponent: Opponent, moves: readonly string[]) {
  const { lines } = await getEngine().search(fen, { depth: botDepth(opponent.rating), multiPv: 6, movetime: 400 })
  const candidates = lines.map((l) => ({ move: l.pv[0], cp: toCentipawns(l.score) }))
  const legal = new Chess(fen).moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''))
  const style = opponent.character?.style
  const weights = style ? candidates.map((c) => styleWeight(style, fen, c.move)) : undefined
  const move = pickBotMove(candidates, legal, opponent.rating, Math.random, weights)
  // Without Maia's likelihoods, judge "obvious" by how far the best move stands out.
  const gap = candidates.length > 1 ? candidates[0].cp - candidates[1].cp : 1000
  const kind = classifyMove(gap > 150 ? 0.8 : gap < 30 ? 0.15 : 0.4, isRecaptureAvailable(fen, moves, move))
  return { choice: { move }, kind }
}

/** True if `move` takes back on the square where the opponent just captured. */
function isRecaptureAvailable(fen: string, moves: readonly string[], move: string | null | undefined): boolean {
  const last = moves.at(-1)
  if (!last || !move || move.slice(2, 4) !== last.slice(2, 4)) return false
  return new Chess(fen).get(move.slice(2, 4) as never) !== undefined
}
