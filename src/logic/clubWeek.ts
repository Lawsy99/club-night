// Where the player is in the club week, for the calendar on Home: this
// week's number and title, and each session done, tonight's, or to come.
import { actPlan, weeksBefore } from '../data/acts'
import { SESSIONS } from '../data/clubWeek'
import { matchUnlocked, PRACTICE_GAMES, type Progress } from './path'

export type SlotState = 'done' | 'today' | 'later'
export type Slot = { key: string; day: string; name: string; state: SlotState }
/** `note`: one line of what else is going on at the club this week. */
export type Week = { title: string; subtitle: string; slots: Slot[]; note?: string }

/** This week at the club (null on trial night, which has its own strip). */
export function clubWeek(p: Progress): Week | null {
  if (p.stage !== 'act' && p.stage !== 'act-complete') return null
  const act = actPlan(p)
  const chapters = act.chapters
  // Week numbers carry on from one season to the next (Week 17 follows the cup).
  const weekNo = (i: number) => weeksBefore(p) + i + 1
  if (p.stage === 'act' && p.chapter < chapters.length) {
    const ch = chapters[p.chapter]
    const open = matchUnlocked(p)
    const state = (done: boolean, today: boolean): SlotState => (done ? 'done' : today ? 'today' : 'later')
    const played = Math.min(p.friendlies.played, PRACTICE_GAMES)
    return {
      title: `Week ${weekNo(p.chapter)}`,
      subtitle: ch.title,
      note: ch.note,
      slots: [
        // Tuesday is the lesson, then the coached game.
        { key: 'coaching', day: 'Tue', name: SESSIONS.coaching.short, state: state(!!p.coachingDone, !p.coachingDone) },
        {
          key: 'practice',
          day: 'Thu',
          name: p.coachingDone && !open ? `Practice ${played + 1}/${PRACTICE_GAMES}` : SESSIONS.practice.short,
          state: state(!!p.coachingDone && open, !!p.coachingDone && !open),
        },
        {
          key: 'match',
          day: 'Sat',
          // Best of three: the score so far once it's started.
          name: p.series && p.series.wins + p.series.losses > 0 ? `Match ${p.series.wins}–${p.series.losses}` : SESSIONS.match.short,
          state: state(false, !!p.coachingDone && open),
        },
      ],
    }
  }
  // The act's final week: one round after another, then the final.
  const g = act.gauntlet
  const round = p.stage === 'act-complete' ? g.slots.length : (p.cup?.round ?? 0)
  return {
    title: g.weekTitle,
    subtitle: g.title,
    note: p.stage === 'act-complete' ? g.afterNote : g.note,
    slots: g.slots.map((name, i) => ({
      key: name,
      day: i === g.slots.length - 1 ? 'Sat' : '',
      name,
      state: i < round ? 'done' : i === round ? 'today' : 'later',
    })),
  }
}
