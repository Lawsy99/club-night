import { describe, expect, it } from 'vitest'
import { coachComment, explainBestMove, explainGoodMove, explainMistake } from './explain'
import { replay } from './game'

const afterNc6 = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6']).fen()
const scholar = replay(['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6']).fen()
const knightHangs = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5']).fen()

describe('explainBestMove', () => {
  it('names a checkmate, and spells out a short forced one', () => {
    expect(explainBestMove(scholar, 'h5f7', 9999)).toBe('Qxf7# is checkmate.')
    // Back-rank mate in two with doubled rooks: Rd8+ Rxd8 Rxd8#.
    expect(explainBestMove('2r3k1/5ppp/8/8/8/8/3R1PPP/3R2K1 w - - 0 1', 'd2d8', 9998, undefined, ['d2d8', 'c8d8', 'd1d8'])).toBe(
      'Rd8+ starts a forced checkmate: Rd8+ Rxd8 Rxd8#.',
    )
  })

  it('names a free piece', () => {
    expect(explainBestMove(knightHangs, 'd8g5', 300)).toBe('Qxg5 wins their knight: nothing can take it back.')
  })

  it('names a fork only when the line proves a forked piece falls', () => {
    const fen = 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1'
    expect(explainBestMove(fen, 'b5c7', 500, undefined, ['b5c7', 'e8d7', 'c7a8'])).toBe('Nc7+ forks their king and rook, and wins a rook.')
    expect(explainBestMove(fen, 'b5c7', 500)).not.toContain('fork')
  })

  it('names a skewer from the line', () => {
    // Rh4+: the king on e4 has to move, and the rook on a4 behind it falls.
    expect(explainBestMove('8/8/8/8/r3k3/8/8/1K5R w - - 0 1', 'h1h4', 500, undefined, ['h1h4', 'e4d5', 'h4a4'])).toBe(
      'Rh4+ skewers their king against the rook behind it, and wins a rook.',
    )
  })

  it('calls a recapture a recapture, not a win', () => {
    // White has just taken on d5: Qxd5 takes back.
    const prevFen = replay(['e2e4', 'd7d5']).fen()
    const fen = replay(['e2e4', 'd7d5', 'e4d5']).fen()
    expect(explainBestMove(fen, 'd8d5', 0, undefined, ['d8d5'], { fen: prevFen, move: 'e4d5' })).toBe('Qxd5 takes back on d5.')
  })

  it('calls a capture that is simply a trade a trade', () => {
    // Nxc6 dxc6: knight for knight.
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4', 'e5d4', 'f3d4', 'g8f6']).fen()
    expect(explainBestMove(fen, 'd4c6', 20, undefined, ['d4c6', 'd7c6'])).toBe('Nxc6 swaps off their knight.')
  })

  it('names saving a piece the move played left hanging', () => {
    expect(explainBestMove('4k3/8/8/8/4p3/5N2/8/4K3 w - - 0 1', 'f3d4', 200, 'e1d2')).toBe('Nd4 gets your knight out of danger.')
  })

  it('otherwise says what the move keeps', () => {
    // Says what the move does where it can…
    expect(explainBestMove(replay([]).fen(), 'e2e4', 30)).toBe('e4 takes space in the centre.')
    // …and only falls back on the score when there's nothing specific to say.
    expect(explainBestMove(replay([]).fen(), 'a2a3', 30)).toBe('a3 keeps the game level.')
  })
})

describe('coachComment', () => {
  it('says what went wrong, then what was better', () => {
    expect(
      coachComment({ fenBefore: afterNc6, played: 'f3g5', bestMove: 'd2d4', reply: 'd8g5', cpBefore: 30, cpAfter: -300 }),
    ).toBe('Your knight on g5 was left undefended: Qxg5 just takes it. Instead, d4 takes space in the centre.')
  })

  it("doesn't repeat itself when the point was a missed chance", () => {
    expect(
      coachComment({ fenBefore: scholar, played: 'h5h3', bestMove: 'h5f7', reply: null, cpBefore: 9999, cpAfter: 50 }),
    ).toBe('You had a forced checkmate, starting with Qxf7#.')
  })
})

describe('explainMistake', () => {
  it('spots walking into mate, and names it', () => {
    const fen = replay(['f2f3', 'e7e5']).fen()
    expect(
      explainMistake({ fenBefore: fen, played: 'g2g4', bestMove: 'e2e4', reply: 'd8h4', cpBefore: -50, cpAfter: -10000 }),
    ).toBe('This allowed Qh4#, checkmate.')
  })

  it('spots a missed mate', () => {
    expect(
      explainMistake({ fenBefore: scholar, played: 'h5h3', bestMove: 'h5f7', reply: null, cpBefore: 9999, cpAfter: 50 }),
    ).toBe('You had a forced checkmate, starting with Qxf7#.')
  })

  it('spots a piece left undefended', () => {
    expect(
      explainMistake({ fenBefore: afterNc6, played: 'f3g5', bestMove: 'd2d4', reply: 'd8g5', cpBefore: 30, cpAfter: -300 }),
    ).toBe('Your knight on g5 was left undefended: Qxg5 just takes it.')
  })

  it('spots a fork, and only says it cost you if it really did', () => {
    // White's rook steps onto c1, where the knight can fork it with the king.
    const fen = '6k1/8/8/8/3n4/8/2R5/6K1 w - - 0 1'
    const facts = { fenBefore: fen, played: 'c2c1', bestMove: 'c2c4', reply: 'd4e2', replyLine: ['d4e2', 'g1f1', 'e2c1'], cpBefore: 0, cpAfter: -500 }
    // During a game: nobody knows yet.
    expect(explainMistake(facts)).toBe('This allowed Ne2+, a fork of your king and rook. It would cost you a rook.')
    // The game went that way.
    expect(explainMistake({ ...facts, actual: ['d4e2', 'g1f1', 'e2c1'] })).toBe('This allowed Ne2+, a fork of your king and rook. It cost you a rook.')
    // They didn't play the fork (Joseph, Sep 2026: never say something happened that didn't).
    expect(explainMistake({ ...facts, actual: ['g8f7', 'c1c4'] })).toBe(
      'This allowed Ne2+, a fork of your king and rook. It would have cost you a rook, but they missed it.',
    )
  })

  it('says so when they played the move but the game went another way', () => {
    // A real tester-style game: 5.Nxf7?? Qxg2 allowed Qxh1+, but White saved the rook with Rf1.
    const moves = 'e2e4 e7e5 g1f3 b8c6 f1c4 c6d4 f3e5 d8g5 e5f7 g5g2 h1f1 g2e4 c4e2 d4f3'.split(' ')
    const text = explainMistake({
      fenBefore: replay(moves.slice(0, 8)).fen(),
      played: 'e5f7',
      bestMove: 'c4f7',
      reply: 'g5g2',
      replyLine: ['g5g2', 'd2d3', 'g2h1', 'e1d2', 'h1d1', 'd2d1'],
      cpBefore: -53,
      cpAfter: -531,
      actual: moves.slice(9),
    })
    expect(text).toContain('would have cost you a rook')
    expect(text).toContain('In the game it went another way.')
  })

  it('says a piece left undefended was taken only if it was', () => {
    const facts = { fenBefore: afterNc6, played: 'f3g5', bestMove: 'd2d4', reply: 'd8g5', cpBefore: 30, cpAfter: -300 }
    expect(explainMistake({ ...facts, actual: ['d8g5'] })).toBe('Your knight on g5 was left undefended, and Qxg5 took it.')
    expect(explainMistake({ ...facts, actual: ['a7a6'] })).toBe('Your knight on g5 was left undefended: Qxg5 would have taken it, but they missed it.')
  })

  it("doesn't call a fair trade a loss", () => {
    // Nxe5 Nxe5: a knight for a knight, then the pawn. Not "your knight was undefended".
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'g8f6', 'b1c3', 'b8c6']).fen()
    const text = explainMistake({ fenBefore: fen, played: 'f3e5', bestMove: 'f1b5', reply: 'c6e5', replyLine: ['c6e5', 'd2d4'], cpBefore: 30, cpAfter: -200 })
    expect(text).toContain('knight for a pawn')
    expect(text).not.toContain('undefended')
  })

  it('spots a missed free piece', () => {
    expect(
      explainMistake({ fenBefore: knightHangs, played: 'a7a6', bestMove: 'd8g5', reply: null, cpBefore: 300, cpAfter: 0 }),
    ).toBe('You missed Qxg5. It wins their knight, which nothing defends.')
  })

  it('says a missed recapture plainly', () => {
    const prevFen = replay(['e2e4', 'd7d5']).fen()
    const fen = replay(['e2e4', 'd7d5', 'e4d5']).fen()
    expect(
      explainMistake({ fenBefore: fen, played: 'a7a6', bestMove: 'd8d5', reply: 'b1c3', cpBefore: 0, cpAfter: -120, prev: { fen: prevFen, move: 'e4d5' } }),
    ).toBe('You needed to take back on d5 with Qxd5.')
  })

  it('falls back to naming the stronger move', () => {
    expect(
      explainMistake({ fenBefore: afterNc6, played: 'h2h4', bestMove: 'f1b5', reply: null, cpBefore: 40, cpAfter: -40 }),
    ).toBe('Bb5 was stronger.')
  })
})

describe('explainGoodMove', () => {
  it('names mates, punishments and wins, from what really happened', () => {
    expect(explainGoodMove(scholar, 'h5f7', false)).toBe('Qxf7#: checkmate.')
    expect(explainGoodMove(knightHangs, 'd8g5', true, undefined, ['d8g5', 'd2d4'])).toBe('You punished their mistake with Qxg5, and won a knight.')
    expect(explainGoodMove(knightHangs, 'd8g5', false, undefined, ['d8g5', 'd2d4'])).toBe('Qxg5 won their knight.')
  })

  it("never says it won something the game didn't", () => {
    // The fork was there (Nc7+ then Nxa8), but in the game the knight went back instead.
    const fen = 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1'
    const line = ['b5c7', 'e8d7', 'c7a8']
    expect(explainGoodMove(fen, 'b5c7', true, line, ['b5c7', 'e8d7', 'c7b5'])).toBe(
      // (Not "punished": in the game it didn't win anything.)
      'Nc7+ was the strongest move on the board. Followed up properly, it wins a rook. The follow-up was Nxa8.',
    )
    expect(explainGoodMove(fen, 'b5c7', true, line, line)).toBe('You punished their mistake with Nc7+, and won a rook.')
  })
})
