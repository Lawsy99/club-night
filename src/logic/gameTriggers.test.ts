import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { triggersFor } from './gameTriggers'

/** The triggers for the last of `moves` (UCI), as the opponent's move. */
function last(moves: string[], extra: { leftBook?: boolean } = {}) {
  const chess = new Chess()
  for (const m of moves.slice(0, -1)) chess.move({ from: m.slice(0, 2), to: m.slice(2, 4) })
  const fenBefore = chess.fen()
  const m = moves.at(-1)!
  const botMove = chess.move({ from: m.slice(0, 2), to: m.slice(2, 4) })
  return triggersFor({ botMove, playerRating: null, botEvalCp: 0, fenBefore, ...extra })
}

describe('character moments', () => {
  it('notices the queens coming off', () => {
    // 1.d4 d5 2.c4 e6 3.cxd5 exd5 ... simplest: a queen trade on d8.
    expect(last(['d2d4', 'd7d5', 'c2c4', 'd5c4', 'd1a4', 'd8d7', 'a4d7', 'b8d7'])).toContain('queens_off')
  })

  it('notices a piece put where it can be taken', () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Ng5: the knight can be taken by the queen for nothing.
    expect(last(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5'])).toContain('sacrifice')
  })

  it("notices the king going for a walk (Terry's favourite)", () => {
    expect(last(['e2e4', 'e7e5', 'e1e2'])).toContain('king_walk')
    expect(last(['e2e4', 'e7e5', 'e1e2'])).not.toContain('castling')
  })

  it('notices leaving the opening book, when told', () => {
    expect(last(['e2e4', 'e7e5'], { leftBook: true })).toContain('out_of_book')
    expect(last(['e2e4', 'e7e5'])).not.toContain('out_of_book')
  })
})
