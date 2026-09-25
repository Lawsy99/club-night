import { describe, expect, it } from 'vitest'
import {
  firstOpponentRating,
  nextTrialOpponentRating,
  strengthFromAccuracy,
  trialEstimate,
  type TrialGame,
} from './trialNight'

const game = (opponentRating: number, won: boolean, accuracyStrength: number | null = null): TrialGame => ({
  opponentRating,
  won,
  accuracyStrength,
})

describe('trial night', () => {
  it('pitches the first game from the answer to the experience question', () => {
    expect(firstOpponentRating('never')).toBe(400)
    expect(firstOpponentRating('rules')).toBe(700)
    expect(firstOpponentRating('casual')).toBe(1000)
    expect(firstOpponentRating('rated', 1450)).toBe(1350)
  })

  it('moves the next opponent by 300, 200, 150, then 100', () => {
    expect(nextTrialOpponentRating([], 1000)).toBe(1000)
    expect(nextTrialOpponentRating([game(1000, true)], 1000)).toBe(1300)
    expect(nextTrialOpponentRating([game(1000, true), game(1300, false)], 1000)).toBe(1100)
    const four = [game(1000, true), game(1300, false), game(1100, true), game(1250, false)]
    expect(nextTrialOpponentRating(four, 1000)).toBe(1150)
  })

  it('never goes below 200', () => {
    expect(nextTrialOpponentRating([game(400, false), game(200, false)], 400)).toBe(200)
  })

  it('starts the player 50 below a blend weighted towards accuracy', () => {
    const games = [1000, 1300, 1100, 1250, 1150].map((r, i) => game(r, i % 2 === 0, 1200))
    const { estimate, start } = trialEstimate(games, 1000)
    expect(estimate).toBeGreaterThan(1100)
    expect(estimate).toBeLessThan(1300)
    expect(start.rating).toBe(estimate - 50)
  })

  it('maps accuracy to a sensible strength', () => {
    expect(strengthFromAccuracy(50)).toBeGreaterThan(1700)
    expect(strengthFromAccuracy(100)).toBeGreaterThan(1000)
    expect(strengthFromAccuracy(100)).toBeLessThan(1300)
    expect(strengthFromAccuracy(400)).toBe(200)
  })
})
