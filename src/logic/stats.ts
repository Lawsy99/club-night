// The stats screen's numbers (design document, "Stats screen"): record
// against each character, accuracy over time and by phase of the game, and
// the player's strongest and weakest openings. Pure functions over the
// archive; the screen does the loading.
import type { Colour } from './game'
import { piecesLeft } from './opponentDecisions'
import { detectOpening } from './planPause'
import { gameAccuracy, type ReviewedMove } from './review'

export type StatsGame = {
  finishedAt: number
  /** The character's id, or null for practice levels. */
  character: string | null
  playerColour: Colour
  result: 'win' | 'loss' | 'draw'
  sans: readonly string[]
  /** Graded moves, for games that were reviewed. */
  reviewed?: readonly ReviewedMove[]
}

export type Record3 = { wins: number; losses: number; draws: number }

/** Wins, losses and draws against each character, in the order given. */
export function recordByCharacter(games: readonly StatsGame[], order: readonly string[]): { id: string; record: Record3 }[] {
  return order
    .map((id) => {
      const record: Record3 = { wins: 0, losses: 0, draws: 0 }
      for (const g of games) {
        if (g.character !== id) continue
        if (g.result === 'win') record.wins++
        else if (g.result === 'loss') record.losses++
        else record.draws++
      }
      return { id, record }
    })
    .filter((r) => r.record.wins + r.record.losses + r.record.draws > 0)
}

/** Accuracy of each reviewed game, oldest first. */
export function accuracyTrend(games: readonly StatsGame[]): { at: number; accuracy: number }[] {
  return games
    .flatMap((g) => {
      const accuracy = g.reviewed ? gameAccuracy(g.reviewed, g.playerColour) : null
      return accuracy === null ? [] : [{ at: g.finishedAt, accuracy }]
    })
    .sort((a, b) => a.at - b.at)
}

export type Phase = 'opening' | 'middlegame' | 'endgame'

/** The opening is the first ten moves each; the endgame starts when six or fewer pieces are left. */
export function phaseOf(move: ReviewedMove): Phase {
  if (move.ply < 20) return 'opening'
  return piecesLeft(move.fenBefore) <= 6 ? 'endgame' : 'middlegame'
}

/** Fewer moves than this in a phase and the average means little. */
const MIN_PHASE_MOVES = 10

/** The player's average move accuracy in each phase, or null where there's too little to go on. */
export function accuracyByPhase(games: readonly StatsGame[]): Record<Phase, number | null> {
  const sums: Record<Phase, { total: number; count: number }> = {
    opening: { total: 0, count: 0 },
    middlegame: { total: 0, count: 0 },
    endgame: { total: 0, count: 0 },
  }
  for (const g of games) {
    for (const m of g.reviewed ?? []) {
      if (m.mover !== g.playerColour) continue
      const s = sums[phaseOf(m)]
      s.total += m.accuracy
      s.count++
    }
  }
  const avg = (s: { total: number; count: number }) => (s.count >= MIN_PHASE_MOVES ? Math.round(s.total / s.count) : null)
  return { opening: avg(sums.opening), middlegame: avg(sums.middlegame), endgame: avg(sums.endgame) }
}

export type OpeningScore = { opening: string; colour: Colour; played: number; score: number }

/** How the player scores in each opening (draws count half), from at least `minGames` games. */
export function openingScores(games: readonly StatsGame[], minGames = 2): OpeningScore[] {
  const tally = new Map<string, OpeningScore & { points: number }>()
  for (const g of games) {
    const opening = detectOpening(g.sans)
    if (!opening) continue
    const key = `${opening}:${g.playerColour}`
    const t = tally.get(key) ?? { opening, colour: g.playerColour, played: 0, score: 0, points: 0 }
    t.played++
    t.points += g.result === 'win' ? 1 : g.result === 'draw' ? 0.5 : 0
    tally.set(key, t)
  }
  return [...tally.values()]
    .filter((t) => t.played >= minGames)
    .map(({ opening, colour, played, points }) => ({ opening, colour, played, score: points / played }))
    .sort((a, b) => b.score - a.score || b.played - a.played)
}
