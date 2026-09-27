// The stats screen's numbers (design document, "Stats screen"): record
// against each character, accuracy over time and by phase of the game, and
// the player's strongest and weakest openings. Pure functions over the
// archive; the screen does the loading.
import type { Colour } from './game'
import { piecesLeft } from './opponentDecisions'
import { detectOpening } from './openings'
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

/**
 * How you're improving (Joseph, Sep 2026: a sense of progress in the
 * learning, like the ladder gives for results). Your last ten reviewed games
 * against the ten before, on the habits the coaching works on.
 */
export type ImprovementRow = {
  label: string
  recent: number
  earlier: number
  /** Lower is better for blunders; higher for the rest. */
  lowerIsBetter: boolean
  unit: '' | '%'
}

export const IMPROVEMENT_WINDOW = 10
/** Fewer reviewed games than this in either half and it isn't shown. */
export const IMPROVEMENT_MIN = 3

export function improvement(games: readonly StatsGame[]): ImprovementRow[] | null {
  const reviewed = games.filter((g) => g.reviewed && g.reviewed.length >= 16).sort((a, b) => b.finishedAt - a.finishedAt)
  const recent = reviewed.slice(0, IMPROVEMENT_WINDOW)
  const earlier = reviewed.slice(IMPROVEMENT_WINDOW, IMPROVEMENT_WINDOW * 2)
  if (recent.length < IMPROVEMENT_MIN || earlier.length < IMPROVEMENT_MIN) return null

  const perGame = (set: readonly StatsGame[], count: (g: StatsGame) => number) =>
    Math.round((set.reduce((sum, g) => sum + count(g), 0) / set.length) * 10) / 10
  const blunders = (g: StatsGame) => g.reviewed!.filter((m) => m.mover === g.playerColour && m.rating === 'blunder').length
  // Punishing their mistakes: after an error of theirs, a good or best reply of yours.
  const punishRate = (set: readonly StatsGame[]) => {
    let chances = 0
    let taken = 0
    for (const g of set) {
      const moves = g.reviewed!
      for (let i = 0; i + 1 < moves.length; i++) {
        const theirs = moves[i]
        if (theirs.mover === g.playerColour || (theirs.rating !== 'mistake' && theirs.rating !== 'blunder')) continue
        chances++
        if (moves[i + 1].rating === 'best' || moves[i + 1].rating === 'good') taken++
      }
    }
    return chances ? Math.round((taken / chances) * 100) : null
  }
  const phaseAcc = (set: readonly StatsGame[], phase: Phase) => {
    const accs = set.flatMap((g) => g.reviewed!.filter((m) => m.mover === g.playerColour && phaseOf(m) === phase).map((m) => m.accuracy))
    return accs.length >= MIN_PHASE_MOVES ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null
  }

  const rows: ImprovementRow[] = [
    { label: 'Blunders a game', recent: perGame(recent, blunders), earlier: perGame(earlier, blunders), lowerIsBetter: true, unit: '' },
  ]
  const pr = punishRate(recent)
  const pe = punishRate(earlier)
  if (pr !== null && pe !== null) rows.push({ label: 'Mistakes of theirs punished', recent: pr, earlier: pe, lowerIsBetter: false, unit: '%' })
  for (const [phase, label] of [
    ['opening', 'Opening accuracy'],
    ['endgame', 'Endgame accuracy'],
  ] as const) {
    const r = phaseAcc(recent, phase)
    const e = phaseAcc(earlier, phase)
    if (r !== null && e !== null) rows.push({ label, recent: r, earlier: e, lowerIsBetter: false, unit: '%' })
  }
  return rows
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
