import { describe, expect, it } from 'vitest'
import { explainMistake } from './explain'
import { replay } from './game'
import { positionalHarm } from './positional'

const kind = (moves: string[], move: string, cp = 0) => positionalHarm(replay(moves).fen(), move, cp)?.kind ?? null

describe('positional harm', () => {
  it('a pawn pushed in front of the castled king', () => {
    const castled = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'e1g1', 'g8f6']
    expect(kind(castled, 'g2g4')).toBe('king-weakened')
    expect(kind(castled, 'a2a3')).toBeNull()
  })

  it('the queen out early', () => {
    expect(kind(['e2e4', 'e7e5'], 'd1h5')).toBe('early-queen')
  })

  it('castling given up by a king walk', () => {
    expect(kind(['e2e4', 'e7e5'], 'e1e2')).toBe('lost-castling')
  })

  it('the same piece again while others are at home', () => {
    expect(kind(['g1f3', 'e7e5'], 'f3g5')).toBe('same-piece-twice')
  })

  it('swapping pieces while behind', () => {
    // A knight trade on c6, with the mover down (cp -300).
    const fen = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6']
    expect(kind(fen, 'b5c6', -300)).toBe('traded-behind')
  })

  it('doubled pawns from taking back the wrong way', () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6: dxc6 keeps the pawns healthy, bxc6 doesn't double; use a doubling capture.
    const moves = ['e2e4', 'd7d5', 'e4d5', 'g8f6', 'd2d4', 'f6d5', 'c2c4', 'd5c3', 'b2c3']
    expect(kind(moves.slice(0, 8), 'b2c3')).toBe('doubled-pawns')
  })

  it("feeds Pemberton's explanation when nothing tactical went wrong", () => {
    const fen = replay(['e2e4', 'e7e5']).fen()
    expect(explainMistake({ fenBefore: fen, played: 'd1h5', bestMove: 'g1f3', reply: 'b8c6', cpBefore: 30, cpAfter: -40 })).toBe(
      'The queen came out early. She’ll be chased about while their pieces develop with tempo.',
    )
  })
})
