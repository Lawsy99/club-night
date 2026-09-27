// Pemberton's monthly test (Joseph, Sep 2026: a sense of improvement). Every
// four weeks, six mixed positions, one try each. The difficulty is pinned to
// the first test, so the same score means the same standard and a better
// score means you really have got better.
import { weeksBefore } from '../data/acts'
import type { Progress } from './path'

export type MonthlyTest = {
  /** Month 1 is weeks 1 to 4, and so on across seasons. */
  month: number
  score: number
  out: number
  /** The puzzle rating the first test was set at; every later test uses it too. */
  baseline: number
  at: number
}

export const WEEKS_PER_MONTH = 4
/** Six positions, from comfortable to a stretch, around the baseline. */
export const TEST_STEPS = [-150, -50, 50, 150, 250, 350] as const

/** The month whose test is waiting, or null. Only the latest: a missed month isn't owed. */
export function monthlyTestDue(p: Progress): number | null {
  if (p.stage !== 'act' && p.stage !== 'act-complete') return null
  const month = Math.floor((weeksBefore(p) + p.chapter) / WEEKS_PER_MONTH)
  if (month < 1) return null
  const last = p.monthlyTests?.at(-1)
  return last && last.month >= month ? null : month
}

/** The level every test is set at: the first test's, or (for the first) today's puzzle rating to the nearest 50. */
export function testBaseline(p: Progress, puzzleRating: number): number {
  return p.monthlyTests?.[0]?.baseline ?? Math.round(puzzleRating / 50) * 50
}

export function testTargets(baseline: number): number[] {
  return TEST_STEPS.map((s) => Math.max(400, baseline + s))
}

export function recordTest(p: Progress, test: MonthlyTest): Progress {
  return { ...p, monthlyTests: [...(p.monthlyTests ?? []), test] }
}

/** Pemberton's verdict, compared with the last test. Understated. */
export function testVerdict(score: number, out: number, previous: MonthlyTest | undefined): string {
  if (!previous) {
    return score >= out - 1
      ? 'A good start. I’ll set the next one at the same level, and we’ll see.'
      : 'That’s where we start. Same level next month, and we’ll see what’s changed.'
  }
  if (score > previous.score) return `Better than last month (${previous.score} of ${previous.out}). It’s working.`
  if (score === previous.score) return `The same as last month. That happens. It isn’t a straight line.`
  return `Down on last month (${previous.score} of ${previous.out}). One month doesn’t mean much. Next time.`
}
