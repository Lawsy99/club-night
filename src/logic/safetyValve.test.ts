import { describe, expect, it } from 'vitest'
import { valveAdjustment, type RealGameResult } from './safetyValve'

const games = (wins: number, strength: number | null, total = 5): RealGameResult[] =>
  Array.from({ length: total }, (_, i) => ({ won: i < wins, accuracyStrength: strength }))

describe('safety valve', () => {
  it('moves the baseline up after 4+ wins with strong play', () => {
    expect(valveAdjustment(games(4, 1200), 1000)).toBe(100)
  })

  it('moves it down after 4+ losses with weak play', () => {
    expect(valveAdjustment(games(1, 800), 1000)).toBe(-100)
  })

  it('needs both the results and the moves to agree', () => {
    expect(valveAdjustment(games(5, 1100), 1000)).toBe(0) // winning, but not by a clear margin
    expect(valveAdjustment(games(3, 1400), 1000)).toBe(0) // strong play, but only 3 wins
    expect(valveAdjustment(games(5, null), 1000)).toBe(0) // no analysis to go on
  })

  it('waits for five games', () => {
    expect(valveAdjustment(games(4, 1400, 4), 1000)).toBe(0)
  })
})
