import { describe, expect, it } from 'vitest'
import { detectOpening } from './openings'

describe('recognising openings', () => {
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
})
