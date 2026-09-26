// The long-term calendar (Joseph, Sep 2026): the season week by week,
// grouped into months of four weeks. No dates, just "Month 1, Week 3".
// Past weeks are ticked, this week is marked, and what's coming is shown,
// so you can see who's next ("next week: Dex") without it being labelled.
// Later seasons carry on the numbering (Month 5, Week 17), with no act numbers.
import { actPlan, weeksBefore } from '../data/acts'
import type { Progress } from './path'

export const WEEKS_PER_MONTH = 4

export type CalendarWeek = {
  week: number
  title: string
  /** Who the week is with (the final week shows the final's opponent). */
  opponent: string
  note?: string
  state: 'done' | 'now' | 'later'
}

export type CalendarMonth = { month: number; weeks: CalendarWeek[] }

export function seasonCalendar(p: Progress): CalendarMonth[] {
  const act = actPlan(p)
  const offset = weeksBefore(p)
  const inAct = p.stage === 'act' || p.stage === 'act-complete'
  const current = !inAct ? -1 : p.stage === 'act-complete' ? Infinity : p.chapter
  const weeks: CalendarWeek[] = act.chapters.map((ch, i) => ({
    week: offset + i + 1,
    title: ch.title,
    opponent: ch.opponent,
    note: ch.note,
    state: i < current ? 'done' : i === current ? 'now' : 'later',
  }))
  const finalIndex = act.chapters.length
  weeks.push({
    week: offset + finalIndex + 1,
    title: act.gauntlet.weekTitle,
    opponent: act.gauntlet.boss.opponent,
    note: act.gauntlet.note,
    state: p.stage === 'act-complete' ? 'done' : current === finalIndex ? 'now' : 'later',
  })
  const months: CalendarMonth[] = []
  for (const w of weeks) {
    const month = monthOf(w.week)
    let m = months.find((x) => x.month === month)
    if (!m) months.push((m = { month, weeks: [] }))
    m.weeks.push(w)
  }
  return months
}

/** "Month 2 · Week 6" for a week number. */
export function monthOf(week: number): number {
  return Math.floor((week - 1) / WEEKS_PER_MONTH) + 1
}
