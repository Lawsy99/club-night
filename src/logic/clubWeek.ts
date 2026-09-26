// Where the player is in the club week, for the calendar on Home: this
// week's number and title, and each session done, tonight's, or to come.
import { ACT_1 } from '../data/act1'
import { SESSIONS } from '../data/clubWeek'
import { matchUnlocked, PRACTICE_GAMES, type Progress } from './path'

export type SlotState = 'done' | 'today' | 'later'
export type Slot = { key: string; day: string; name: string; state: SlotState }
export type Week = { title: string; subtitle: string; slots: Slot[] }

const CUP_SLOTS = ['Round 1', 'Round 2', 'Semi-final', 'Final']

/** This week at the club (null on trial night, which has its own strip). */
export function clubWeek(p: Progress): Week | null {
  if (p.stage !== 'act' && p.stage !== 'act-complete') return null
  const chapters = ACT_1.chapters
  if (p.stage === 'act' && p.chapter < chapters.length) {
    const ch = chapters[p.chapter]
    const open = matchUnlocked(p)
    const state = (done: boolean, today: boolean): SlotState => (done ? 'done' : today ? 'today' : 'later')
    const played = Math.min(p.friendlies.played, PRACTICE_GAMES)
    return {
      title: `Week ${p.chapter + 1}`,
      subtitle: ch.title,
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
  // The knockout cup: one round after another, then the final.
  const round = p.stage === 'act-complete' ? CUP_SLOTS.length : (p.cup?.round ?? 0)
  return {
    title: 'Cup week',
    subtitle: ACT_1.gauntlet.title,
    slots: CUP_SLOTS.map((name, i) => ({
      key: name,
      day: i === CUP_SLOTS.length - 1 ? 'Sat' : '',
      name,
      state: i < round ? 'done' : i === round ? 'today' : 'later',
    })),
  }
}
