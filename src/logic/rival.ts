// The rival system, level 1 (design document, "The rival system"): Toby
// studies the player's games. From 10 real games on, he steers towards the
// opening where the player scores worst, and Coach Pemberton says so.
import type { Colour } from './game'
import { detectOpening } from './openings'

export type PlayedGame = { sans: readonly string[]; playerColour: Colour; won: boolean; rated: boolean }

/** Targeting only starts once there's enough evidence. */
export const RIVAL_MIN_REAL_GAMES = 10

export type Weakness = { opening: string; colour: Colour; score: number; games: number }

/**
 * The opening (and colour) where the player scores worst, from at least two
 * games in it. Score is the share of games won, 0 to 1.
 */
export function worstOpening(games: readonly PlayedGame[], minGames = 2): Weakness | null {
  const tally = new Map<string, { won: number; played: number; opening: string; colour: Colour }>()
  for (const g of games) {
    const opening = detectOpening(g.sans)
    if (!opening) continue
    const key = `${opening}:${g.playerColour}`
    const t = tally.get(key) ?? { won: 0, played: 0, opening, colour: g.playerColour }
    t.played++
    if (g.won) t.won++
    tally.set(key, t)
  }
  let worst: Weakness | null = null
  for (const t of tally.values()) {
    if (t.played < minGames) continue
    const score = t.won / t.played
    if (!worst || score < worst.score || (score === worst.score && t.played > worst.games)) {
      worst = { opening: t.opening, colour: t.colour, score, games: t.played }
    }
  }
  return worst
}

/** Toby targets only after 10 real games, and only a genuine weakness (under half won). */
export function rivalTarget(games: readonly PlayedGame[]): Weakness | null {
  if (games.filter((g) => g.rated).length < RIVAL_MIN_REAL_GAMES) return null
  const worst = worstOpening(games)
  return worst && worst.score < 0.5 ? worst : null
}
