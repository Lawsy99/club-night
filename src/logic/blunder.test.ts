import { describe, expect, it } from 'vitest'
import { HELP_STAGES } from '../data/helpStages'
import { assessMove, describeBlunder } from './blunder'
import { formatCp, formatScore, scoreFor, winChance } from './evaluation'

const cp = (value: number) => ({ type: 'cp' as const, value })
const mate = (value: number) => ({ type: 'mate' as const, value })
const assisted = HELP_STAGES.assisted.blunderWarning
const guided = HELP_STAGES.guided.blunderWarning

describe('blunder warnings', () => {
  it('assisted warns from 2 pawns lost', () => {
    expect(assessMove({ bestBefore: cp(30), after: cp(-180) }, assisted)).toBe('loses-material')
    expect(assessMove({ bestBefore: cp(30), after: cp(-150) }, assisted)).toBeNull()
  })

  it('guided only warns for about a piece', () => {
    expect(assessMove({ bestBefore: cp(30), after: cp(-180) }, guided)).toBeNull()
    expect(assessMove({ bestBefore: cp(30), after: cp(-290) }, guided)).toBe('loses-material')
  })

  it('real never warns', () => {
    expect(assessMove({ bestBefore: cp(30), after: mate(-1) }, HELP_STAGES.real.blunderWarning)).toBeNull()
  })

  it('warns when a move walks into mate', () => {
    expect(assessMove({ bestBefore: cp(50), after: mate(-2) }, guided)).toBe('allows-mate')
  })

  it("doesn't nag when mate was coming anyway", () => {
    expect(assessMove({ bestBefore: mate(-3), after: mate(-2) }, assisted)).toBeNull()
  })

  it("doesn't nag when still completely winning", () => {
    expect(assessMove({ bestBefore: cp(1500), after: cp(1100) }, assisted)).toBeNull()
    expect(assessMove({ bestBefore: mate(3), after: cp(900) }, assisted)).toBeNull()
  })

  it('does warn when throwing away a winning position', () => {
    expect(assessMove({ bestBefore: mate(2), after: cp(0) }, guided)).toBe('loses-material')
  })

  it('names the piece the reply would take', () => {
    // White's knight has just gone to d4, where Black's e5 pawn can take it.
    const fen = 'rnbqkbnr/ppp2ppp/3p4/4p3/3NP3/8/PPPP1PPP/RNBQKB1R b KQkq - 1 3'
    expect(describeBlunder('loses-material', fen, 'e5d4')).toBe('That lets them take your knight.')
    expect(describeBlunder('loses-material', fen, 'a7a6')).toBe('That gives away a lot.')
    expect(describeBlunder('allows-mate', fen, null)).toBe('That allows a forced checkmate.')
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
