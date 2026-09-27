import { describe, expect, it } from 'vitest'
import { monthlyTestDue, recordTest, testBaseline, testTargets, testVerdict, type MonthlyTest } from './monthlyTest'
import { NEW_PROGRESS, type Progress } from './path'

const inAct = (chapter: number, over: Partial<Progress> = {}): Progress => ({ ...NEW_PROGRESS, stage: 'act', chapter, ...over })
const test = (month: number, score: number, baseline = 1000): MonthlyTest => ({ month, score, out: 6, baseline, at: 0 })

describe('the monthly test', () => {
  it('is due once each four weeks are done', () => {
    expect(monthlyTestDue(inAct(3))).toBeNull()
    expect(monthlyTestDue(inAct(4))).toBe(1)
    expect(monthlyTestDue(inAct(5, { monthlyTests: [test(1, 3)] }))).toBeNull()
    expect(monthlyTestDue(inAct(8, { monthlyTests: [test(1, 3)] }))).toBe(2)
    expect(monthlyTestDue({ ...NEW_PROGRESS, stage: 'trial' })).toBeNull()
  })

  it('only owes the latest month', () => {
    expect(monthlyTestDue(inAct(9))).toBe(2)
  })

  it('counts Act 1 weeks in Act 2', () => {
    // Act 1 is sixteen weeks: Month 4 ends as Act 2 begins.
    expect(monthlyTestDue(inAct(0, { act: 2, monthlyTests: [test(3, 4)] }))).toBe(4)
    expect(monthlyTestDue(inAct(3, { act: 2, monthlyTests: [test(4, 4)] }))).toBeNull()
    expect(monthlyTestDue(inAct(4, { act: 2, monthlyTests: [test(4, 4)] }))).toBe(5)
  })

  it('keeps the first test’s level so scores compare', () => {
    expect(testBaseline(inAct(4), 1234)).toBe(1250)
    expect(testBaseline(inAct(8, { monthlyTests: [test(1, 3, 900)] }), 1400)).toBe(900)
    expect(testTargets(1000)).toEqual([850, 950, 1050, 1150, 1250, 1350])
    expect(testTargets(450)[0]).toBe(400)
  })

  it('records and compares', () => {
    const p = recordTest(inAct(4), test(1, 3))
    expect(p.monthlyTests).toHaveLength(1)
    expect(testVerdict(4, 6, test(1, 3))).toContain('Better')
    expect(testVerdict(2, 6, test(1, 3))).toContain('Down')
  })
})
