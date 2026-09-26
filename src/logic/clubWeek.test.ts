import { describe, expect, it } from 'vitest'
import { ACT_1 } from '../data/act1'
import { clubWeek } from './clubWeek'
import { beginTrial, completeLesson, NEW_PROGRESS, nextStep, recordGame, type Progress } from './path'

function inWeekOne(): Progress {
  let p = beginTrial(NEW_PROGRESS, 'casual')
  for (let i = 0; i < 5; i++) {
    const step = nextStep(p)
    if (step.kind !== 'play') throw new Error('expected a game')
    p = recordGame(p, step.game, true, 1100)
  }
  return p
}

const states = (p: Progress) => clubWeek(p)!.slots.map((s) => s.state)

describe('the club week', () => {
  it('has no week on trial night', () => {
    expect(clubWeek(beginTrial(NEW_PROGRESS, 'casual'))).toBeNull()
  })

  it('runs Tuesday coaching, Thursday practice, Saturday match', () => {
    let p = inWeekOne()
    expect(clubWeek(p)).toMatchObject({ title: 'Week 1', subtitle: ACT_1.chapters[0].title })
    expect(states(p)).toEqual(['today', 'later', 'later'])
    p = completeLesson(p)
    expect(states(p)).toEqual(['done', 'today', 'later'])
    // Winning a guided practice game opens Saturday.
    p = { ...p, friendlies: { played: 2, wonGuided: true } }
    expect(states(p)).toEqual(['done', 'done', 'today'])
  })

  it('becomes cup week once the chapters are done', () => {
    const p: Progress = { ...inWeekOne(), chapter: ACT_1.chapters.length, cup: { round: 2, bossRating: 1300, bossAttempts: 0 } }
    const week = clubWeek(p)!
    expect(week.title).toBe('Cup week')
    expect(week.slots.map((s) => s.state)).toEqual(['done', 'done', 'today', 'later'])
  })
})
