import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { replay } from './game'
import { styleWeight } from './style'

describe('style nudges', () => {
  const start = new Chess().fen()

  it('aggressive players like checks and captures', () => {
    const fen = replay(['e2e4', 'd7d5']).fen()
    expect(styleWeight('aggressive', fen, 'e4d5')).toBeGreaterThan(1) // capture
    expect(styleWeight('aggressive', fen, 'f1b5')).toBeGreaterThan(1) // check
    expect(styleWeight('aggressive', fen, 'a2a3')).toBe(1)
  })

  it('solid players like developing and castling', () => {
    expect(styleWeight('solid', start, 'g1f3')).toBeGreaterThan(1)
    expect(styleWeight('solid', start, 'h2h4')).toBe(1)
  })

  it('simplifiers like even trades', () => {
    // After 1.e4 d5, exd5 swaps pawns; Bb5+ trades nothing.
    const fen = replay(['e2e4', 'd7d5']).fen()
    expect(styleWeight('simplifying', fen, 'e4d5')).toBeGreaterThan(1)
    expect(styleWeight('simplifying', fen, 'f1b5')).toBe(1)
  })

  it('grinders trade only when ahead', () => {
    // Black has won a knight; now a pawn trade is on offer for Black.
    const ahead = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5', 'd8g5', 'd2d4']).fen()
    expect(styleWeight('grinding', ahead, 'e5d4')).toBeGreaterThan(1)
    const level = replay(['e2e4', 'd7d5']).fen()
    expect(styleWeight('grinding', level, 'e4d5')).toBe(1)
  })

  it('never changes anything for book-led or adaptive styles', () => {
    expect(styleWeight('theoretical', start, 'e2e4')).toBe(1)
    expect(styleWeight('adaptive', start, 'e2e4')).toBe(1)
  })
})
