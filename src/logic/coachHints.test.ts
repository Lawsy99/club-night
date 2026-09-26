import { describe, expect, it } from 'vitest'
import { coachHint } from './coachHints'
import { replay } from './game'

describe("the coach's hints", () => {
  it('spots a mate on the board', () => {
    const fen = replay(['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6']).fen()
    expect(coachHint(fen, 'h5f7', 9999)).toBe('There’s a checkmate on the board. Find it.')
  })

  it('warns about a mate threat before anything else', () => {
    // Black threatens ...Qxf2# (queen h4, bishop c5); White should defend.
    const fen = 'rnb1k1nr/pppp1ppp/8/2b1p3/4P2q/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 1'
    expect(coachHint(fen, 'd1e2', 0)).toBe('Is your king safe? What are they threatening?')
  })

  it('points at a loose piece of theirs', () => {
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5']).fen()
    expect(coachHint(fen, 'd8g5', 300)).toBe('Something of theirs isn’t defended.')
  })

  it('suggests a fork without naming the square', () => {
    expect(coachHint('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', 'b5c7', 500)).toBe('Could your knight attack two things at once?')
  })

  it('says which piece of yours is in trouble', () => {
    expect(coachHint('4k3/8/8/8/4p3/5N2/8/4K3 w - - 0 1', 'f3d4', 0)).toBe('Your knight is in trouble.')
  })

  it('otherwise names the piece to think about', () => {
    expect(coachHint(replay([]).fen(), 'g1f3', 30)).toBe('Think about your knight.')
  })
})
