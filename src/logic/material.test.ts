import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { replay } from './game'
import { materialFor } from './material'

describe('materialFor', () => {
  it('is level at the start', () => {
    const fen = new Chess().fen()
    expect(materialFor(fen, 'w')).toEqual({ captured: [], lead: 0 })
  })

  it('lists captures and the lead', () => {
    // 1.e4 d5 2.exd5 Qxd5: each side has taken a pawn.
    const fen = replay(['e2e4', 'd7d5', 'e4d5', 'd8d5']).fen()
    expect(materialFor(fen, 'w')).toEqual({ captured: ['p'], lead: 0 })
    // 3.Ng5?? Qxg5: Black has won White's knight.
    const knightLost = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5', 'd8g5']).fen()
    expect(materialFor(knightLost, 'b')).toEqual({ captured: ['n'], lead: 3 })
    expect(materialFor(knightLost, 'w').lead).toBe(0)
  })
})
