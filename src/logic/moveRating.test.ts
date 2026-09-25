import { describe, expect, it } from 'vitest'
import { rateMove } from './moveRating'

const cp = (value: number) => ({ type: 'cp' as const, value })
const mate = (value: number) => ({ type: 'mate' as const, value })
const rate = (before: number, after: number) =>
  rateMove({ bestBefore: cp(before), after: cp(after), playedBestMove: false })

describe('rateMove', () => {
  it("calls the engine's own choice the best move", () => {
    expect(rateMove({ bestBefore: cp(40), after: cp(35), playedBestMove: true })).toBe('best')
  })

  it('treats an equally good alternative as best', () => {
    expect(rate(40, 38)).toBe('best')
  })

  it('grades by how much the winning chances dropped', () => {
    expect(rate(40, 0)).toBe('good')
    expect(rate(40, -30)).toBe('inaccuracy')
    expect(rate(40, -80)).toBe('mistake')
    expect(rate(40, -300)).toBe('blunder')
  })

  it('is forgiving when already completely winning', () => {
    // +10 to +8 barely changes the chance of winning.
    expect(rate(1000, 800)).toBe('good')
  })

  it('calls walking into mate a blunder', () => {
    expect(rateMove({ bestBefore: cp(20), after: mate(-3), playedBestMove: false })).toBe('blunder')
  })
})
