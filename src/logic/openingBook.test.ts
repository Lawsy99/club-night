import { describe, expect, it } from 'vitest'
import { OPENING_BOOKS } from '../data/openingBooks'
import { bookMove, parseLine } from './openingBook'

describe('opening books', () => {
  it('contain only legal lines, 6 to 12 moves deep', () => {
    for (const [who, book] of Object.entries(OPENING_BOOKS)) {
      for (const line of [...book.white, ...book.black]) {
        let moves: string[] = []
        expect(() => (moves = parseLine(line)), `${who}: ${line}`).not.toThrow()
        const fullMoves = Math.ceil(moves.length / 2)
        expect(fullMoves, `${who}: ${line}`).toBeGreaterThanOrEqual(6)
        expect(fullMoves, `${who}: ${line}`).toBeLessThanOrEqual(12)
      }
    }
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

  it('chooses between branches', () => {
    // Dex as White: King's Gambit or Danish after 1.e4 e5.
    const picks = new Set([0, 0.99].map((r) => bookMove('dex', 'w', ['e2e4', 'e7e5'], () => r)))
    expect(picks).toEqual(new Set(['f2f4', 'd2d4']))
  })
})
