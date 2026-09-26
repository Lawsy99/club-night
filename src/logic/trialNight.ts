// Trial night: four placement games that set the starting rating, then a
// game against Toby that doesn't count (design document, "Trial night").
import { MIN_RATING } from '../data/characters'
import { rateGame, type PlayerRating } from './glicko2'

export type Experience = 'never' | 'rules' | 'casual' | 'rated'

/** The first opponent's strength, from "roughly how much chess have you played?" */
export function firstOpponentRating(experience: Experience, statedRating?: number): number {
  switch (experience) {
    case 'never':
      return 400
    case 'rules':
      return 700
    case 'casual':
      return 1000
    case 'rated':
      return Math.max(MIN_RATING, (statedRating ?? 1100) - 100)
  }
}

/** A win moves the next opponent up, a loss down; the step shrinks each game. */
const STEPS = [300, 200, 150, 100]

export type TrialGame = {
  opponentRating: number
  won: boolean
  /** Strength estimated from the moves themselves (see strengthFromAccuracy). */
  accuracyStrength: number | null
}

/** Placement games (the Toby game after them isn't one). */
export const TRIAL_LENGTH = 4

/** Stored as the Toby game's rating; never shown, and never used for rating maths. */
export const FULL_STRENGTH_RATING = 3000

export function nextTrialOpponentRating(games: readonly TrialGame[], first: number): number {
  let rating = first
  games.forEach((g, i) => {
    rating += (g.won ? 1 : -1) * (STEPS[i] ?? 100)
  })
  return Math.max(MIN_RATING, rating)
}

/**
 * The starting rating. Two signals, blended: the rating the four results
 * imply, and the strength the moves themselves suggest (accuracy). Accuracy
 * counts more because four results alone are noisy. The player then starts
 * 50 below the estimate, so the first chapter feels good.
 * (The 65/35 blend is to be tuned in playtesting.)
 */
export const ACCURACY_WEIGHT = 0.65
export const START_BELOW = 50

export function trialEstimate(games: readonly TrialGame[], first: number): { estimate: number; start: PlayerRating } {
  // Results: run the games through Glicko-2 from an uncertain start.
  let byResults: PlayerRating = { rating: first, deviation: 350, volatility: 0.06 }
  for (const g of games) byResults = rateGame(byResults, g.opponentRating, g.won ? 1 : 0)

  const strengths = games.map((g) => g.accuracyStrength).filter((s): s is number => s !== null)
  const byAccuracy = strengths.length ? strengths.reduce((a, b) => a + b, 0) / strengths.length : null
  const estimate =
    byAccuracy === null ? byResults.rating : ACCURACY_WEIGHT * byAccuracy + (1 - ACCURACY_WEIGHT) * byResults.rating

  const rating = Math.max(MIN_RATING, Math.round(estimate - START_BELOW))
  // Still fairly uncertain after four games: it keeps moving quickly for a while.
  return { estimate: Math.round(estimate), start: { rating, deviation: 150, volatility: 0.06 } }
}

/**
 * Playing strength suggested by average centipawn loss (how much advantage
 * the player gave away per move, in hundredths of a pawn). A common rough
 * fit: about 1900 at 50, 1150 at 100, 700 at 150. To be tuned in playtesting.
 */
export function strengthFromAccuracy(averageLoss: number): number {
  const estimate = 3100 * Math.exp(-0.01 * averageLoss)
  return Math.round(Math.min(2600, Math.max(MIN_RATING, estimate)))
}
