import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { OPENING_BOOKS } from '../data/openingBooks'
import { bookMove, parseLine } from './openingBook'

describe('opening books', () => {
  it('contain only legal lines, 6 to 12 moves deep (or ending in mate)', () => {
    for (const [who, book] of Object.entries(OPENING_BOOKS)) {
      for (const line of [...book.white, ...book.black]) {
        let moves: string[] = []
        expect(() => (moves = parseLine(line)), `${who}: ${line}`).not.toThrow()
        const fullMoves = Math.ceil(moves.length / 2)
        // Terry's traps are short because they finish the game.
        if (!line.endsWith('#')) expect(fullMoves, `${who}: ${line}`).toBeGreaterThanOrEqual(6)
        expect(fullMoves, `${who}: ${line}`).toBeLessThanOrEqual(12)
      }
    }
  })

  it('mating lines really are checkmate', () => {
    for (const line of [...OPENING_BOOKS.terry.white, ...OPENING_BOOKS.terry.black].filter((l) => l.endsWith('#'))) {
      const chess = new Chess()
      for (const uci of parseLine(line)) chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      expect(chess.isCheckmate(), line).toBe(true)
    }
  })

  it('Terry plays the Bongcloud, the Grob and friends', () => {
    const firstMoves = new Set([0, 0.3, 0.5, 0.7, 0.99].map((r) => bookMove('terry', 'w', [], () => r)))
    expect(firstMoves).toEqual(new Set(['e2e4', 'g2g4', 'g1h3']))
    // After 1.e4 e5 he may walk the king.
    const second = new Set([0, 0.2, 0.5, 0.99].map((r) => bookMove('terry', 'w', ['e2e4', 'e7e5'], () => r)))
    expect(second.has('e1e2')).toBe(true)
  })

  it("puts the character's own moves on the right side", () => {
    // White lines start with the character's move; Black lines answer the player's.
    expect(bookMove('marjorie', 'w', [])).toBe('d2d4')
    expect(bookMove('marjorie', 'w', ['d2d4', 'd7d5'])).toBe('c1f4') // the London
    expect(bookMove('marjorie', 'b', ['e2e4'])).toBe('e7e6') // the French
    expect(bookMove('dex', 'b', ['d2d4'])).toBe('e7e5') // the Englund
  })

  it('leaves the book when the player does something else', () => {
    expect(bookMove('marjorie', 'w', ['d2d4', 'g7g5'])).toBeNull()
    expect(bookMove('toby', 'b', ['a2a3'])).toBeNull()
    expect(bookMove('nobody', 'w', [])).toBeNull()
  })

  it('steers towards a preferred opening when one is targeted', () => {
    // Clive as White against 1...e5 has only the Ruy Exchange: a preference can't invent lines.
    expect(bookMove('clive', 'w', ['e2e4', 'e7e5'], () => 0, 'french')).toBe('g1f3')
    // Toby as Black against 1.e4 always heads for the Sicilian.
    expect(bookMove('toby', 'b', ['e2e4'], () => 0.99, 'sicilian')).toBe('c7c5')
  })

  it('chooses between branches', () => {
    // Dex as White: King's Gambit or Danish after 1.e4 e5.
    const picks = new Set([0, 0.99].map((r) => bookMove('dex', 'w', ['e2e4', 'e7e5'], () => r)))
    expect(picks).toEqual(new Set(['f2f4', 'd2d4']))
  })
})
