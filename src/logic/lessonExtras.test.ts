import { describe, expect, it } from 'vitest'
import { findOwnExample, puzzleExplanation, showsTheme } from './lessonExtras'
import { replay } from './game'
import type { PositionEval } from './review'

// Two Knights: after 5...Nxd5?, 6.Nxf7 forks queen and rook. White played 6.d4 instead.
const moves = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'f3g5', 'd7d5', 'e4d5', 'f6d5', 'd2d4']
const evals: PositionEval[] = moves.map(() => ({ cp: 30, bestMove: null as string | null }))
evals.push({ cp: 20, bestMove: null })
evals[10] = { cp: 150, bestMove: 'g5f7' }
evals[11] = { cp: 20, bestMove: 'c8e6' }

describe('lessons from your own games', () => {
  it('recognises a fork in a position you had', () => {
    expect(showsTheme(replay(moves.slice(0, 10)).fen(), 'g5f7', 150, ['fork'])).toBe(true)
    expect(showsTheme(replay(moves.slice(0, 10)).fen(), 'd2d4', 150, ['fork'])).toBe(false)
  })

  it('finds the one you missed, with the move before for context', () => {
    const example = findOwnExample(
      [{ id: 'g1', moves, evals, playerColour: 'w', opponentName: 'Dex', finishedAt: 0 }],
      ['fork'],
    )
    expect(example?.missed).toBe(true)
    expect(example?.opponentName).toBe('Dex')
    expect(example?.moment.bestMove).toBe('g5f7')
    expect(example?.moment.prevMove).toBe('f6d5')
  })

  it('finds nothing for a theme the games never showed', () => {
    expect(findOwnExample([{ id: 'g1', moves, evals, playerColour: 'w', opponentName: 'Dex', finishedAt: 0 }], ['skewer'])).toBeNull()
  })
})

describe('puzzle explanations', () => {
  it('says why the answer works', () => {
    // Setup move ...Nxd5, then the answer Nxf7 (a fork).
    const puzzle = {
      id: 'p1',
      fen: replay(moves.slice(0, 9)).fen(),
      moves: ['f6d5', 'g5f7'],
      rating: 1200,
      themes: ['fork'],
      opening: 'italian',
    }
    expect(puzzleExplanation(puzzle)).toBe('Nxf7 is a fork: your knight attacks their queen and rook at once.')
  })
})
