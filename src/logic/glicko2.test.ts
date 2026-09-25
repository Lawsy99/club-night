import { describe, expect, it } from 'vitest'
import { NEW_PLAYER, rateGame } from './glicko2'

describe('Glicko-2', () => {
  it("matches Glickman's worked example (one game from it)", () => {
    // Glickman's paper: player 1500/200/0.06 beats a 1400/30 opponent,
    // loses to 1550/100 and 1700/300. Here we check the first game alone
    // moves the rating up and shrinks the deviation.
    const after = rateGame({ rating: 1500, deviation: 200, volatility: 0.06 }, 1400, 1, 30)
    expect(after.rating).toBeGreaterThan(1500)
    expect(after.deviation).toBeLessThan(200)
  })

  it('moves a lot early on, and less once settled', () => {
    const newBig = rateGame(NEW_PLAYER, 1500, 1).rating - 1500
    const settled = rateGame({ rating: 1500, deviation: 60, volatility: 0.06 }, 1500, 1).rating - 1500
    expect(newBig).toBeGreaterThan(100)
    expect(settled).toBeLessThan(20)
    expect(settled).toBeGreaterThan(0)
  })

  it('rewards beating stronger players more than weaker ones', () => {
    const me = { rating: 1200, deviation: 80, volatility: 0.06 }
    const upset = rateGame(me, 1400, 1).rating - 1200
    const expectedWin = rateGame(me, 1000, 1).rating - 1200
    expect(upset).toBeGreaterThan(expectedWin)
  })

  it('costs points for a loss', () => {
    const me = { rating: 1200, deviation: 80, volatility: 0.06 }
    expect(rateGame(me, 1200, 0).rating).toBeLessThan(1200)
  })
})
