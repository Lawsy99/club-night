import { describe, expect, it } from 'vitest'
import {
  averageCentipawnLoss,
  bestMoveOfGame,
  biggestMoments,
  gameAccuracy,
  moveAccuracy,
  ratingCounts,
  reviewMoves,
  type PositionEval,
} from './review'

const ev = (cp: number, bestMove: string | null = null): PositionEval => ({ cp, bestMove })

describe('moveAccuracy', () => {
  it('is 100 when nothing is lost', () => {
    expect(moveAccuracy(0.6, 0.6)).toBe(100)
    expect(moveAccuracy(0.5, 0.7)).toBe(100)
  })

  it('falls steeply with bigger drops', () => {
    expect(moveAccuracy(0.6, 0.55)).toBeGreaterThan(75)
    expect(moveAccuracy(0.6, 0.3)).toBeLessThan(30)
  })
})

describe('reviewMoves', () => {
  // Fool's mate: 2.g4?? is a clear blunder by White.
  const moves = ['f2f3', 'e7e5', 'g2g4', 'd8h4']
  const evals = [
    ev(30, 'e2e4'),
    ev(-60, 'e7e5'),
    ev(-50, 'd2d4'),
    ev(-10000, 'd8h4'), // after g4??, Black mates at once
    ev(-10000, null), // checkmate: White lost
  ]
  const reviewed = reviewMoves(moves, evals)

  it('reads the moves in normal notation', () => {
    expect(reviewed.map((m) => m.san)).toEqual(['f3', 'e5', 'g4', 'Qh4#'])
  })

  it('grades from the mover’s point of view', () => {
    expect(reviewed[2].mover).toBe('w')
    expect(reviewed[2].rating).toBe('blunder')
    expect(reviewed[3].rating).toBe('best') // played the engine's move
  })

  it('picks the biggest moments and the best move', () => {
    // In the order they happened; 1.f3 is an inaccuracy, 2.g4 the blunder.
    expect(biggestMoments(reviewed, 'w').map((m) => m.san)).toEqual(['f3', 'g4'])
    expect(biggestMoments(reviewed, 'w', 1).map((m) => m.san)).toEqual(['g4'])
    const best = bestMoveOfGame(reviewed, 'b')
    expect(best?.move.san).toBe('Qh4#')
    expect(best?.punished).toBe(true) // it punished g4??
    // White's only "best" moves were routine opening moves: no highlight.
    expect(bestMoveOfGame(reviewed, 'w')).toBeNull()
  })

  it('never picks castling, and only says punished when the move won something in the game', () => {
    // Black castles right after White castled, a move the engine calls best,
    // after White's previous move was graded a mistake. Nothing was won.
    const castled = ['e2e4', 'e7e5', 'g1f3', 'g8f6', 'f1c4', 'f8c5', 'e1g1', 'e8g8', 'd2d3', 'd7d6', 'c1g5', 'h7h6']
    const castledEvals = castled.map(() => ev(20))
    castledEvals.push(ev(20))
    castledEvals[6] = ev(20, 'e1g1')
    castledEvals[7] = ev(-60, 'e8g8') // White's O-O graded as a slip for the test
    castledEvals[8] = ev(-60, 'd2d3')
    const r = reviewMoves(castled, castledEvals)
    const pick = bestMoveOfGame(r, 'b')
    expect(pick?.move.san).not.toBe('O-O')
    expect(pick?.punished ?? false).toBe(false)
  })

  it('works out the average advantage given away, capped', () => {
    // White: f3 lost 90, g4 lost 950 (capped at the 10-pawn limit) → (90 + 950) / 2
    expect(averageCentipawnLoss(moves, evals, 'w')).toBe(520)
    // Black: e5 gave away 10 (+60 → +50), Qh4# nothing → 5
    expect(averageCentipawnLoss(moves, evals, 'b')).toBe(5)
  })

  it('works out accuracy and counts per side', () => {
    expect(gameAccuracy(reviewed, 'b')).toBeGreaterThan(90)
    expect(gameAccuracy(reviewed, 'w')).toBeLessThan(50)
    expect(ratingCounts(reviewed, 'w').blunder).toBe(1)
  })
})
