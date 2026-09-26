import { describe, expect, it } from 'vitest'
import { ACT_1 } from '../data/act1'
import { monthOf, seasonCalendar } from './calendar'
import { NEW_PROGRESS, type Progress } from './path'

const at = (chapter: number): Progress => ({ ...NEW_PROGRESS, stage: 'act', chapter })

describe('the long-term calendar', () => {
  it('lays the season out in months of four weeks, ending with cup week', () => {
    const months = seasonCalendar(at(0))
    const weeks = months.flatMap((m) => m.weeks)
    expect(weeks).toHaveLength(ACT_1.chapters.length + 1)
    expect(months.length).toBe(4)
    expect(weeks.at(-1)!.title).toBe('Cup week')
    expect(monthOf(1)).toBe(1)
    expect(monthOf(5)).toBe(2)
  })

  it('ticks past weeks, marks this one, and shows who is next', () => {
    const weeks = seasonCalendar(at(1)).flatMap((m) => m.weeks)
    expect(weeks[0].state).toBe('done')
    expect(weeks[1]).toMatchObject({ state: 'now', opponent: 'dex' })
    expect(weeks[2].state).toBe('later')
  })
})
