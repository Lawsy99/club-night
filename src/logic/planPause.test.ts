import { describe, expect, it } from 'vitest'
import { PLANS } from '../data/plans'
import { detectOpening, planFor, shouldPausePlan } from './planPause'

describe('plan pause', () => {
  it('recognises the characters’ openings', () => {
    expect(detectOpening(['d4', 'd5', 'Bf4', 'Nf6'])).toBe('london')
    expect(detectOpening(['e4', 'e6', 'd4', 'd5', 'Nc3'])).toBe('french')
    expect(detectOpening(['e4', 'e6', 'd4', 'd5', 'exd5'])).toBe('exchange')
    expect(detectOpening(['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6'])).toBe('gambit')
    expect(detectOpening(['e4', 'e5', 'Nf3', 'Nf6', 'Nc3'])).toBe('petroff')
    expect(detectOpening(['d4', 'Nf6', 'c4', 'e6', 'g3'])).toBe('catalan')
    expect(detectOpening(['e4', 'c5', 'Nf3', 'd6'])).toBe('sicilian')
    expect(detectOpening(['a3'])).toBeNull()
  })

  it('offers plans for the player’s side, or nothing', () => {
    expect(planFor(['d4', 'd5', 'Bf4'], 'b')?.options).toHaveLength(3)
    expect(planFor(['d4', 'd5', 'Bf4'], 'w')).toBeNull() // no London plans written for its own side
  })

  it('always has exactly one best plan per set', () => {
    for (const bySide of Object.values(PLANS)) {
      for (const set of Object.values(bySide)) {
        expect(set!.options).toHaveLength(3)
        expect(set!.options.filter((o) => o.quality === 'best')).toHaveLength(1)
      }
    }
  })

  it('pauses once, in assisted games, from move 10 on the player’s turn', () => {
    const base = { stage: 'assisted', alreadyDone: false, moveNumber: 10, playersTurn: true }
    expect(shouldPausePlan(base)).toBe(true)
    expect(shouldPausePlan({ ...base, moveNumber: 9 })).toBe(false)
    expect(shouldPausePlan({ ...base, stage: 'guided' })).toBe(false)
    expect(shouldPausePlan({ ...base, alreadyDone: true })).toBe(false)
    expect(shouldPausePlan({ ...base, playersTurn: false })).toBe(false)
  })
})
