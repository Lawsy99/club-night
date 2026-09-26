import { describe, expect, it } from 'vitest'
import { matchMoment } from './matchReaction'

describe('big moments in competitive games', () => {
  it('shows blunders', () => {
    expect(matchMoment('blunder', 0.2, 0.5)).toBe('blunder')
  })

  it('shows a great move: the best move that turns a level game into a winning one', () => {
    expect(matchMoment('best', 0.85, 0.5)).toBe('great')
    // Already winning: just another good move, nothing shown.
    expect(matchMoment('best', 0.9, 0.85)).toBeNull()
    // Best, but the game's still level.
    expect(matchMoment('best', 0.55, 0.5)).toBeNull()
  })

  it('shows nothing for ordinary moves', () => {
    expect(matchMoment('good', 0.6, 0.5)).toBeNull()
    expect(matchMoment('inaccuracy', 0.4, 0.5)).toBeNull()
    expect(matchMoment('mistake', 0.3, 0.5)).toBeNull()
  })
})
