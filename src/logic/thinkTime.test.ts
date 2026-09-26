import { describe, expect, it } from 'vitest'
import { characterOpponentId, resolveOpponent } from '../data/opponents'
import { classifyMove, thinkTime } from './thinkTime'

describe('thinking time', () => {
  it('classifies moves by how sure a human would be', () => {
    expect(classifyMove(0.8, false)).toBe('obvious')
    expect(classifyMove(0.1, true)).toBe('obvious') // recaptures are quick
    expect(classifyMove(0.4, false)).toBe('normal')
    expect(classifyMove(0.1, false)).toBe('complex')
    expect(classifyMove(0.1, false, 1)).toBe('forced') // the only legal move
  })

  it("stays within the design's ranges, scaled by the character's pace", () => {
    expect(thinkTime('book', 1, () => 0)).toBe(600)
    expect(thinkTime('complex', 1, () => 1)).toBe(9000)
    expect(thinkTime('normal', 0.5, () => 0)).toBe(900) // Oscar-quick
    expect(thinkTime('forced', 1.4, () => 1)).toBe(400) // pace doesn't slow an only move
  })
})

describe('opponents', () => {
  it('works out a character from the baseline, and keeps a saved rating', () => {
    const marjorie = resolveOpponent(characterOpponentId('marjorie'))
    expect(marjorie.name).toBe('Marjorie')
    expect(marjorie.rating).toBe(940) // default baseline 1000 − 60
    expect(resolveOpponent(characterOpponentId('marjorie'), 700).engine).toBe('bot')
    expect(resolveOpponent(characterOpponentId('marjorie'), 1300).engine).toBe('maia')
  })

  it('falls back to a practice level for anything else', () => {
    expect(resolveOpponent('club').name).toBe('Club player')
  })
})
