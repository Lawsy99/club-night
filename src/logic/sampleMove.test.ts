import { describe, expect, it } from 'vitest'
import { sampleMove } from './sampleMove'

const policy = [
  { move: 'e2e4', p: 0.6 },
  { move: 'd2d4', p: 0.35 },
  { move: 'g2g4', p: 0.005 }, // too rare to play
]

describe('sampleMove', () => {
  it('plays moves in proportion to their likelihood', () => {
    expect(sampleMove(policy, () => 0.1)).toBe('e2e4')
    expect(sampleMove(policy, () => 0.9)).toBe('d2d4')
  })

  it('never plays a move a human would rarely consider', () => {
    for (let r = 0; r < 1; r += 0.01) expect(sampleMove(policy, () => r)).not.toBe('g2g4')
  })

  it('falls back to the likeliest move if everything is rare', () => {
    expect(sampleMove([{ move: 'a2a3', p: 0.004 }, { move: 'h2h3', p: 0.003 }], () => 0.99)).toBe('a2a3')
  })

  it('returns null with no moves', () => {
    expect(sampleMove([])).toBeNull()
  })
})
