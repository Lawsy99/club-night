import { describe, expect, it } from 'vitest'
import { replay } from './game'
import { joinIdeas, moveIdeas } from './moveIdeas'

describe('what a move does', () => {
  it('sees development and the centre', () => {
    expect(moveIdeas(replay([]).fen(), 'g1f3')).toContain('develops your knight towards the centre')
    expect(moveIdeas(replay([]).fen(), 'e2e4')).toContain('takes space in the centre')
  })

  it('sees castling', () => {
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5']).fen()
    expect(moveIdeas(fen, 'e1g1')).toContain('tucks your king away and brings a rook into play')
  })

  it('sees a pin', () => {
    // Bb5 pins the knight on c6 to the king on e8 (after ...d6).
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4', 'd7d6']).fen()
    expect(moveIdeas(fen, 'f1b5')).toContain('pins their knight to their king')
  })

  it('sees a defence against a threat', () => {
    // Black's queen on h4 and bishop on c5 threaten f2; Qe2 guards it.
    const fen = 'rnb1k1nr/pppp1ppp/8/2b1p3/4P2q/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 4'
    expect(moveIdeas(fen, 'd1e2')[0]).toBe('stops their mate threat')
  })

  it('sees a new attack on a piece', () => {
    // After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4?, 4.Nxd4 is a capture; instead c3 attacks the knight on d4.
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'c6d4']).fen()
    expect(moveIdeas(fen, 'c2c3')).toContain('attacks their knight on d4')
  })

  it('sees a passed pawn being pushed', () => {
    expect(moveIdeas('8/8/4k3/8/1P6/8/8/4K3 w - - 0 40', 'b4b5')).toContain('pushes your passed pawn')
  })

  it('joins ideas into a sentence', () => {
    expect(joinIdeas(['develops your knight', 'attacks their queen on d6'])).toBe('develops your knight and attacks their queen on d6')
  })
})
