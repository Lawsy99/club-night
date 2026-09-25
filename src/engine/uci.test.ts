import { describe, expect, it } from 'vitest'
import { parseBestMove, parseInfoLine } from './uci'

describe('parseInfoLine', () => {
  it('reads a centipawn score and the line', () => {
    const line =
      'info depth 12 seldepth 16 multipv 2 score cp -35 nodes 12345 nps 500000 time 25 pv e7e5 g1f3 b8c6'
    expect(parseInfoLine(line)).toEqual({
      rank: 2,
      depth: 12,
      score: { type: 'cp', value: -35 },
      pv: ['e7e5', 'g1f3', 'b8c6'],
    })
  })

  it('reads a mate score', () => {
    const line = 'info depth 5 score mate -2 nodes 100 pv g2g4 d8h4'
    expect(parseInfoLine(line)?.score).toEqual({ type: 'mate', value: -2 })
    expect(parseInfoLine(line)?.rank).toBe(1)
  })

  it('ignores provisional (bound) results', () => {
    expect(parseInfoLine('info depth 14 score cp 40 upperbound nodes 1 pv d2d4')).toBeNull()
    expect(parseInfoLine('info depth 14 score cp 40 lowerbound nodes 1 pv d2d4')).toBeNull()
  })

  it('ignores lines without a scored line', () => {
    expect(parseInfoLine('info string NNUE evaluation using nn.nnue')).toBeNull()
    expect(parseInfoLine('info depth 10 currmove e2e4 currmovenumber 1')).toBeNull()
    expect(parseInfoLine('readyok')).toBeNull()
  })
})

describe('parseBestMove', () => {
  it('reads the move', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4')
    expect(parseBestMove('bestmove e7e8q')).toBe('e7e8q')
  })

  it('returns null when there is no legal move', () => {
    expect(parseBestMove('bestmove (none)')).toBeNull()
  })

  it('ignores other lines', () => {
    expect(parseBestMove('info depth 1')).toBeUndefined()
  })
})
