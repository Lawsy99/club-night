import { describe, expect, it } from 'vitest'
import {
  isCorrect,
  looksAlike,
  parsePuzzle,
  pickPuzzles,
  ratePuzzle,
  solverColour,
  startPosition,
  type Puzzle,
} from './puzzles'

// A real Lichess puzzle (0000D): White wins the exchange-down endgame with Qd6.
const row: [string, string, string, number, string, string] = [
  '0000D',
  '5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27',
  'd3d6 f8d8 d6d8 f6d8',
  1468,
  'advantage endgame',
  '',
]

describe('puzzles', () => {
  const p = parsePuzzle(row)

  it('reads the compact rows', () => {
    expect(p.moves).toEqual(['d3d6', 'f8d8', 'd6d8', 'f6d8'])
    expect(p.themes).toEqual(['advantage', 'endgame'])
  })

  it('lets the opponent move first, then the player solves', () => {
    expect(solverColour(p)).toBe('b')
    expect(startPosition(p).split(' ')[1]).toBe('b')
  })

  it('accepts the right move and rejects others', () => {
    const fen = startPosition(p)
    expect(isCorrect(p, fen, 1, 'f8d8')).toBe(true)
    expect(isCorrect(p, fen, 1, 'b6b2')).toBe(false)
  })

  it('accepts any checkmate, even if it is not the listed move', () => {
    // Back-rank position: both Rd8# and Qd8# mate.
    const mate: Puzzle = {
      id: 'x',
      fen: '6k1/5ppp/8/8/8/8/5PPP/3RQ1K1 b - - 0 1',
      moves: ['g8h8', 'd1d8'],
      rating: 800,
      themes: ['backRankMate'],
      opening: '',
    }
    const fen = startPosition(mate)
    expect(isCorrect(mate, fen, 1, 'd1d8')).toBe(true)
    expect(isCorrect(mate, fen, 1, 'e1e8')).toBe(true)
  })

  // Four clearly different positions, so none are skipped as "the same game".
  const FENS = [
    '5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27',
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    '8/8/4k3/8/2P5/8/5K2/8 w - - 0 50',
    'rnbqkb1r/pp2pppp/5n2/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq - 0 4',
  ]

  it('picks puzzles by theme or opening, near the target rating', () => {
    const pool: Puzzle[] = [
      { ...p, id: 'a', fen: FENS[0], rating: 1000, themes: ['fork'] },
      { ...p, id: 'b', fen: FENS[1], rating: 1050, themes: ['fork'] },
      { ...p, id: 'c', fen: FENS[2], rating: 2000, themes: ['fork'] },
      { ...p, id: 'd', fen: FENS[3], rating: 1000, themes: ['pin'], opening: 'london' },
    ]
    const forks = pickPuzzles(pool, { themes: ['fork'], rating: 1000, count: 2 })
    expect(forks.map((x) => x.id).sort()).toEqual(['a', 'b'])
    expect(pickPuzzles(pool, { openings: ['london'], rating: 1000, count: 1 })[0].id).toBe('d')
    // Both: a London puzzle that is also a pin.
    expect(pickPuzzles(pool, { openings: ['london'], themes: ['pin'], both: true, rating: 1000, count: 1 })[0].id).toBe('d')
    expect(pickPuzzles(pool, { themes: ['fork'], rating: 1000, count: 2, exclude: new Set(['a']) }).map((x) => x.id)).not.toContain('a')
  })

  it('never picks two puzzles that look like the same game a few moves apart', () => {
    const nearly = FENS[0].replace('P4PPP', 'P3PPP1') // two pawns shifted
    expect(looksAlike(FENS[0], nearly)).toBe(true)
    expect(looksAlike(FENS[0], FENS[1])).toBe(false)
    const pool: Puzzle[] = [
      { ...p, id: 'a', fen: FENS[0], rating: 1000, themes: ['fork'] },
      { ...p, id: 'a2', fen: nearly, rating: 1010, themes: ['fork'] },
      { ...p, id: 'b', fen: FENS[1], rating: 1020, themes: ['fork'] },
    ]
    const picked = pickPuzzles(pool, { themes: ['fork'], rating: 1000, count: 2 })
    expect(picked.map((x) => x.fen)).not.toEqual([FENS[0], nearly])
    expect(new Set(picked.map((x) => x.fen)).size).toBe(2)
  })

  it('moves the puzzle rating up for a clean solve and down for a miss', () => {
    const me = { rating: 1200, deviation: 150, volatility: 0.06 }
    expect(ratePuzzle(me, 1200, true).rating).toBeGreaterThan(1200)
    expect(ratePuzzle(me, 1200, false).rating).toBeLessThan(1200)
  })
})
