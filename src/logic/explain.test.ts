import { describe, expect, it } from 'vitest'
import { explainGoodMove, explainMistake } from './explain'
import { replay } from './game'

const afterNc6 = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6']).fen()

describe('explainMistake', () => {
  it('spots walking into mate', () => {
    const fen = replay(['f2f3', 'e7e5']).fen()
    expect(
      explainMistake({ fenBefore: fen, played: 'g2g4', bestMove: 'e2e4', reply: 'd8h4', cpBefore: -50, cpAfter: -10000 }),
    ).toBe('This allowed a forced checkmate.')
  })

  it('spots a missed mate', () => {
    // Scholar's mate set up: Qxf7 is mate, but White plays something else.
    const fen = replay(['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6']).fen()
    expect(
      explainMistake({ fenBefore: fen, played: 'h5h3', bestMove: 'h5f7', reply: null, cpBefore: 9999, cpAfter: 50 }),
    ).toBe('You had a forced checkmate, starting with Qxf7#.')
  })

  it('spots a piece left undefended', () => {
    expect(
      explainMistake({ fenBefore: afterNc6, played: 'f3g5', bestMove: 'd2d4', reply: 'd8g5', cpBefore: 30, cpAfter: -300 }),
    ).toBe('Your knight on g5 was left undefended.')
  })

  it('spots a fork', () => {
    // White's rook steps onto c1, where the knight can fork it with the king.
    const fen = '6k1/8/8/8/3n4/8/2R5/6K1 w - - 0 1'
    expect(
      explainMistake({ fenBefore: fen, played: 'c2c1', bestMove: 'c2c4', reply: 'd4e2', cpBefore: 0, cpAfter: -500 }),
    ).toBe('This allowed a fork: their knight on e2 attacks your king and rook.')
  })

  it('spots a missed free piece', () => {
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5']).fen()
    expect(
      explainMistake({ fenBefore: fen, played: 'a7a6', bestMove: 'd8g5', reply: null, cpBefore: 300, cpAfter: 0 }),
    ).toBe('You missed Qxg5, which wins their knight.')
  })

  it('falls back to naming the stronger move', () => {
    expect(
      explainMistake({ fenBefore: afterNc6, played: 'h2h4', bestMove: 'f1b5', reply: null, cpBefore: 40, cpAfter: -40 }),
    ).toBe('Bb5 was stronger.')
  })
})

describe('explainGoodMove', () => {
  it('names mates, punishments and wins', () => {
    const scholar = replay(['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6']).fen()
    expect(explainGoodMove(scholar, 'h5f7', false)).toBe('Qxf7#: checkmate.')
    const hanging = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5']).fen()
    expect(explainGoodMove(hanging, 'd8g5', true)).toBe('You punished their mistake with Qxg5.')
    expect(explainGoodMove(hanging, 'd8g5', false)).toBe('Qxg5 won their knight.')
  })
})
