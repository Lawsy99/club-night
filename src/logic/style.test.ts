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

describe('personal traits', () => {
  it('queen traders take the even queen swap', () => {
    const fen = replay(['d2d4', 'd7d5', 'c2c4', 'd5c4', 'd1a4', 'd8d7', 'a4d7', 'b8d7']).fen()
    // (Queens already gone there; use a position with the swap on offer instead.)
    const offer = replay(['d2d4', 'd7d5', 'c2c4', 'd5c4', 'd1a4', 'd8d7']).fen()
    expect(styleWeight('solid', offer, 'a4d7', ['queen-trader'])).toBeGreaterThan(styleWeight('solid', offer, 'a4d7'))
    expect(styleWeight('solid', fen, 'e2e4', ['queen-trader'])).toBe(1)
  })

  it('pawn stormers push the pawns in front of the king', () => {
    // Black has castled short; White's g- and h-pawns are the storm.
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'g8f6', 'f1c4', 'f8c5', 'd2d3', 'e8g8']).fen()
    expect(styleWeight('solid', fen, 'h2h4', ['pawn-storm'])).toBeGreaterThan(1)
    expect(styleWeight('solid', fen, 'a2a3', ['pawn-storm'])).toBe(1)
  })

  it("Terry's king likes a walk", () => {
    const fen = replay(['e2e4', 'e7e5']).fen()
    expect(styleWeight('aggressive', fen, 'e1e2', ['king-walker'])).toBeGreaterThan(1)
  })
})
