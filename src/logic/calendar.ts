// The long-term calendar (Joseph, Sep 2026): the season week by week,
// grouped into months of four weeks. No dates, just "Month 1, Week 3".
// Past weeks are ticked, this week is marked, and what's coming is shown,
// so you can see who's next ("next week: Dex") without it being labelled.
import { ACT_1 } from '../data/act1'
import type { Progress } from './path'

export const WEEKS_PER_MONTH = 4

export type CalendarWeek = {
  week: number
  title: string
  /** Who the week is with (the cup week shows the final's opponent). */
  opponent: string
  note?: string
  state: 'done' | 'now' | 'later'
}

export type CalendarMonth = { month: number; weeks: CalendarWeek[] }

export function seasonCalendar(p: Progress): CalendarMonth[] {
  const inAct = p.stage === 'act' || p.stage === 'act-complete'
  const current = !inAct ? -1 : p.stage === 'act-complete' ? Infinity : p.chapter
  const weeks: CalendarWeek[] = ACT_1.chapters.map((ch, i) => ({
    week: i + 1,
    title: ch.title,
    opponent: ch.opponent,
    note: ch.note,
    state: i < current ? 'done' : i === current ? 'now' : 'later',
  }))
  const cupIndex = ACT_1.chapters.length
  weeks.push({
    week: cupIndex + 1,
    title: 'Cup week',
    opponent: ACT_1.gauntlet.boss.opponent,
    note: 'The club knockout cup, round by round.',
    state: p.stage === 'act-complete' ? 'done' : current === cupIndex ? 'now' : 'later',
  })
  const months: CalendarMonth[] = []
  for (const w of weeks) {
    const month = Math.floor((w.week - 1) / WEEKS_PER_MONTH) + 1
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
