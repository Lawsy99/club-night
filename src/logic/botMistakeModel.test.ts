import { describe, expect, it } from 'vitest'
import { botDepth, mistakeProfile, pickBotMove } from './botMistakeModel'

const candidates = [
  { move: 'best', cp: 100 },
  { move: 'ok', cp: 60 },
  { move: 'bad', cp: -300 },
]
const legal = ['best', 'ok', 'bad', 'random1', 'random2']

/** Plays many moves with a seeded random source and counts the choices. */
function tally(rating: number, runs = 4000) {
  let seed = 42
  const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
  const counts: Record<string, number> = {}
  for (let i = 0; i < runs; i++) {
    const m = pickBotMove(candidates, legal, rating, random)!
    counts[m] = (counts[m] ?? 0) + 1
  }
  return (m: string) => (counts[m] ?? 0) / runs
}

describe('bot mistake model', () => {
  it('gets more careful as the rating rises', () => {
    expect(mistakeProfile(200).carelessness).toBeGreaterThan(mistakeProfile(600).carelessness)
    expect(mistakeProfile(500).looseness).toBeLessThan(mistakeProfile(400).looseness)
    expect(mistakeProfile(500).looseness).toBeGreaterThan(mistakeProfile(600).looseness)
    expect(botDepth(300)).toBeLessThan(botDepth(750))
  })

  it('plays the best move more often at higher ratings', () => {
    expect(tally(750)('best')).toBeGreaterThan(tally(300)('best'))
  })

  it('still sometimes plays something careless at the bottom', () => {
    const at300 = tally(300)
    expect(at300('random1') + at300('random2')).toBeGreaterThan(0.05)
  })

  it('rarely picks a clearly losing candidate near 800', () => {
    expect(tally(790)('bad')).toBeLessThan(0.05)
  })

  it('copes with no candidates or no moves', () => {
    expect(pickBotMove([], ['a'], 400, () => 0.5)).toBe('a')
    expect(pickBotMove([], [], 400)).toBeNull()
  })
})
