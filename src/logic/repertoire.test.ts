import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { REPERTOIRE_CHOICES, type RepertoireSlot } from '../data/repertoire'
import { inferRepertoire, nextInLine, openingPlayed, repertoireHint, sanInWords } from './repertoire'

const slots = Object.keys(REPERTOIRE_CHOICES) as RepertoireSlot[]

describe('repertoire lines', () => {
  it('are all legal', () => {
    for (const slot of slots) {
      for (const choice of REPERTOIRE_CHOICES[slot]) {
        for (const line of choice.lines) {
          const chess = new Chess()
          for (const san of line) {
            expect(() => chess.move(san), `${choice.id}: ${line.join(' ')} at ${san}`).not.toThrow()
          }
        }
      }
    }
  })

  it("never disagree about the player's next move from the same position", () => {
    for (const slot of slots) {
      const playerIsWhite = slot === 'white'
      for (const choice of REPERTOIRE_CHOICES[slot]) {
        const next = new Map<string, string>()
        for (const line of choice.lines) {
          line.forEach((san, i) => {
            const whiteToMove = i % 2 === 0
            if (whiteToMove !== playerIsWhite) return
            const key = line.slice(0, i).join(' ')
            const known = next.get(key)
            expect(known === undefined || known === san, `${choice.id} after "${key}": ${known} vs ${san}`).toBe(true)
            next.set(key, san)
          })
        }
      }
    }
  })

  it('start with the right first move for each slot', () => {
    for (const choice of REPERTOIRE_CHOICES.vsE4) for (const l of choice.lines) expect(l[0]).toBe('e4')
    for (const choice of REPERTOIRE_CHOICES.vsD4) for (const l of choice.lines) expect(l[0]).toBe('d4')
  })
})

describe('working out the repertoire from games', () => {
  const g = (sans: string[], playerColour: 'w' | 'b') => ({ sans, playerColour })

  it('recognises each opening from the player’s own moves', () => {
    expect(openingPlayed(['d4', 'd5', 'Bf4'], 'w')).toEqual({ slot: 'white', id: 'london' })
    expect(openingPlayed(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], 'w')).toEqual({ slot: 'white', id: 'italian' })
    expect(openingPlayed(['e4', 'c6'], 'b')).toEqual({ slot: 'vsE4', id: 'caro-kann' })
    expect(openingPlayed(['d4', 'Nf6', 'c4', 'g6'], 'b')).toEqual({ slot: 'vsD4', id: 'kid' })
    expect(openingPlayed(['e4', 'e6'], 'b')).toBeNull() // the French isn't one of the eight
  })

  it('takes the most played in each situation, from two games up', () => {
    const rep = inferRepertoire([
      g(['d4', 'd5', 'Bf4'], 'w'),
      g(['d4', 'Nf6', 'Bf4'], 'w'),
      g(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], 'w'),
      g(['e4', 'c5'], 'b'), // only once: not yet
    ])
    expect(rep).toEqual({ white: 'london' })
  })
})

describe("following Pemberton's line", () => {
  const line = ['e4', 'e6', 'd4', 'd5', 'e5']
  it('gives the next move while the game follows the line, on your turn only', () => {
    expect(nextInLine([], 'w', line)).toBe('e4')
    expect(nextInLine(['e4', 'e6'], 'w', line)).toBe('d4')
    expect(nextInLine(['e4'], 'w', line)).toBeNull()
    expect(nextInLine(['e4', 'c5'], 'w', line)).toBeNull()
  })
})

describe('moves in words', () => {
  it('reads moves without notation', () => {
    expect(sanInWords('Nf3')).toBe('knight to f3')
    expect(sanInWords('exd5')).toBe('pawn takes on d5')
    expect(sanInWords('Bxc6+')).toBe('bishop takes on c6')
    expect(sanInWords('d4')).toBe('pawn to d4')
    expect(sanInWords('O-O')).toBe('castle kingside')
    expect(sanInWords('Nbd2')).toBe('knight to d2')
  })
})

describe('repertoire hints', () => {
  const rep = { white: 'london', vsE4: 'caro-kann', vsD4: 'kid' }

  it("gives the player's next move while the game follows a line", () => {
    expect(repertoireHint([], 'w', rep)).toEqual({ opening: 'the London', san: 'd4' })
    expect(repertoireHint(['d4', 'd5'], 'w', rep)?.san).toBe('Bf4')
    expect(repertoireHint(['e4'], 'b', rep)).toEqual({ opening: 'the Caro-Kann', san: 'c6' })
    expect(repertoireHint(['d4'], 'b', rep)?.san).toBe('Nf6')
  })

  it("says nothing on the opponent's turn, off book, or without a repertoire", () => {
    expect(repertoireHint(['d4'], 'w', rep)).toBeNull()
    expect(repertoireHint(['d4', 'h5'], 'w', rep)).toBeNull()
    expect(repertoireHint(['c4'], 'b', rep)).toBeNull()
    expect(repertoireHint([], 'w', undefined)).toBeNull()
  })
})
