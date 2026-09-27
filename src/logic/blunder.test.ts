import { describe, expect, it } from 'vitest'
import { HELP_STAGES } from '../data/helpStages'
import { assessMove, describeBlunder } from './blunder'
import { formatCp, formatScore, scoreFor, winChance } from './evaluation'

const cp = (value: number) => ({ type: 'cp' as const, value })
const mate = (value: number) => ({ type: 'mate' as const, value })
const assisted = HELP_STAGES.assisted.blunderWarning
// A stricter rule (only about a piece or mate), to test the thresholds.
const pieceOnly = { minLossCp: 250, allowsMate: true }

describe('blunder warnings', () => {
  it('assisted warns from 2 pawns lost', () => {
    expect(assessMove({ bestBefore: cp(30), after: cp(-180) }, assisted)).toBe('loses-material')
    expect(assessMove({ bestBefore: cp(30), after: cp(-150) }, assisted)).toBeNull()
  })

  it('a stricter rule only warns for about a piece', () => {
    expect(assessMove({ bestBefore: cp(30), after: cp(-180) }, pieceOnly)).toBeNull()
    expect(assessMove({ bestBefore: cp(30), after: cp(-290) }, pieceOnly)).toBe('loses-material')
  })

  it('practice and real games never warn before a move', () => {
    expect(assessMove({ bestBefore: cp(30), after: mate(-1) }, HELP_STAGES.guided.blunderWarning)).toBeNull()
    expect(assessMove({ bestBefore: cp(30), after: mate(-1) }, HELP_STAGES.real.blunderWarning)).toBeNull()
  })

  it('warns when a move walks into mate', () => {
    expect(assessMove({ bestBefore: cp(50), after: mate(-2) }, pieceOnly)).toBe('allows-mate')
  })

  it("doesn't nag when mate was coming anyway", () => {
    expect(assessMove({ bestBefore: mate(-3), after: mate(-2) }, assisted)).toBeNull()
  })

  it("doesn't nag when still completely winning", () => {
    expect(assessMove({ bestBefore: cp(1500), after: cp(1100) }, assisted)).toBeNull()
    expect(assessMove({ bestBefore: mate(3), after: cp(900) }, assisted)).toBeNull()
  })

  it('does warn when throwing away a winning position', () => {
    expect(assessMove({ bestBefore: mate(2), after: cp(0) }, pieceOnly)).toBe('loses-material')
  })

  it('names what the line really loses, once the exchanges are done', () => {
    // White's knight goes to d4, where Black's e5 pawn can take it for nothing.
    const fen = 'rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3'
    expect(describeBlunder('loses-material', fen, 'f3d4', ['e5d4'])).toBe('That loses a knight.')
    // Taking a defended pawn: a knight for a pawn, not "they take your knight".
    expect(describeBlunder('loses-material', fen, 'f3e5', ['d6e5'])).toBe('That loses a knight for a pawn.')
    expect(describeBlunder('loses-material', fen, 'f3d4', ['a7a6'])).toBe('That gives away a lot.')
    expect(describeBlunder('allows-mate', fen, 'f3d4', [])).toBe('That allows a forced checkmate.')
  })
})

describe('evaluation display', () => {
  it('formats scores the usual way', () => {
    expect(formatScore(cp(143))).toBe('+1.4')
    expect(formatScore(cp(-30))).toBe('−0.3')
    expect(formatScore(cp(2))).toBe('0.0')
    expect(formatScore(mate(3))).toBe('M3')
    expect(formatScore(mate(-2))).toBe('−M2')
  })

  it('formats stored centipawns, including mates', () => {
    expect(formatCp(143)).toBe('+1.4')
    expect(formatCp(9997)).toBe('M3')
    expect(formatCp(-9998)).toBe('−M2')
    expect(formatCp(-10000)).toBe('#')
  })

  it("converts to either side's point of view", () => {
    expect(scoreFor('w', 'b', cp(50))).toEqual(cp(-50))
    expect(scoreFor('b', 'b', cp(50))).toEqual(cp(50))
  })

  it('turns scores into win chances', () => {
    expect(winChance(cp(0))).toBeCloseTo(0.5)
    expect(winChance(cp(300))).toBeGreaterThan(0.7)
    expect(winChance(mate(1))).toBeGreaterThan(0.97)
    expect(winChance(mate(-1))).toBeLessThan(0.03)
  })
})
