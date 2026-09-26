import { describe, expect, it } from 'vitest'
import { OPENING_DRILLS } from '../data/openingLessons'
import { buildDemo } from './demo'
import { replay } from './game'
import { drillFinished, drillLines, drillReply, expectedMoves, openingAdvice } from './openingDrill'
import { parseLine } from './openingBook'

describe('opening lessons', () => {
  it('have legal demos and lines, and a reason for every White move', () => {
    for (const drill of Object.values(OPENING_DRILLS)) {
      expect(() => buildDemo(drill.demo), drill.id).not.toThrow()
      for (const line of drill.lines) {
        const whiteMoves = line
          .split(/\s+/)
          .filter((t) => t && !/^\d+\.+$/.test(t))
          .filter((_, i) => i % 2 === 0)
        expect(() => parseLine(line), line).not.toThrow()
        for (const san of whiteMoves) expect(drill.why[san], `${drill.id}: why ${san}?`).toBeDefined()
      }
    }
  })

  it('knows the next White move, and varies Black’s replies', () => {
    const italian = OPENING_DRILLS.italian
    expect(expectedMoves(italian, [])).toEqual(['e2e4'])
    const replies = new Set([0, 0.99].map((r) => drillReply(italian, ['e2e4', 'e7e5', 'g1f3'], () => r)))
    expect(replies).toEqual(new Set(['b8c6', 'd7d6']))
    expect(drillFinished(italian, drillLines(italian)[0])).toBe(true)
  })

  it('explains the principle a wrong move breaks', () => {
    const start = replay([]).fen()
    expect(openingAdvice(start, 'g1h3', [], null)).toContain('edge')
    expect(openingAdvice(start, 'h2h4', [], null)).toContain('Pawns on the edge')
    const afterE4E5 = replay(['e2e4', 'e7e5']).fen()
    expect(openingAdvice(afterE4E5, 'd1h5', ['e2e4', 'e7e5'], null)).toContain('Not the queen')
    const later = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6']).fen()
    expect(openingAdvice(later, 'f3g5', ['e2e4', 'e7e5', 'g1f3', 'b8c6'], null)).toContain('already moved')
  })
})
