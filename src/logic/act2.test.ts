import { describe, expect, it } from 'vitest'
import { ACT_2 } from '../data/act2'
import { findCharacter } from '../data/characters'
import { findLesson } from '../data/lessons'
import { OPENING_BOOKS } from '../data/openingBooks'
import { seasonCalendar } from './calendar'
import { clubWeek } from './clubWeek'
import { NEW_PROGRESS, nextStep, opponentRating, recordGame, startNextAct, type PathGame, type Progress } from './path'

/** A player who has just won the cup (Act 1 done). */
const afterTheCup = (): Progress => ({
  ...NEW_PROGRESS,
  stage: 'act-complete',
  rating: { rating: 1400, deviation: 80, volatility: 0.06 },
  baseline: 1200,
  trialStart: 1200,
  fixedRatings: { marjorie: 1140, clive: 1170, graham: 1250, malcolm: 1520, ray: 1390, sheila: 960, bill: 870 },
  chapter: 15,
  lessonDone: true,
  coachingDone: true,
  cup: { round: 3, bossRating: 1450, bossAttempts: 0 },
})

describe('Act 2: the club ladder', () => {
  it('starts from the act-complete card, and only then', () => {
    expect(nextStep(afterTheCup())).toMatchObject({ kind: 'act-complete', nextAct: true })
    const p = startNextAct(afterTheCup())
    expect(p).toMatchObject({ act: 2, stage: 'act', chapter: 0, cup: null, lessonDone: false, coachingDone: false })
    expect(nextStep(p)).toMatchObject({ kind: 'lesson', chapterId: 'a2-1', topic: 'Playing Black: answering 1.e4' })
    // Starting again from a season in progress does nothing.
    expect(startNextAct(p)).toBe(p)
  })

  it('has a lesson, a playable opponent and an opening book for every week', () => {
    for (const ch of ACT_2.chapters) {
      expect(findLesson(ch.id), ch.id).toBeDefined()
      expect(findCharacter(ch.opponent), ch.id).toBeDefined()
    }
    for (const r of [...ACT_2.gauntlet.rounds, ACT_2.gauntlet.boss]) expect(findCharacter(r.opponent), r.opponent).toBeDefined()
    expect(OPENING_BOOKS.malcolm).toBeDefined()
    expect(OPENING_BOOKS.ray).toBeDefined()
  })

  it('calls Saturdays ladder challenges, and carries the week numbers on', () => {
    let p = startNextAct(afterTheCup())
    p = { ...p, lessonDone: true, coachingDone: true, friendlies: { played: 3, wonGuided: false } }
    const step = nextStep(p)
    if (step.kind !== 'play') throw new Error('expected a game')
    expect(step.game.label).toContain('Ladder challenge vs Graham')
    expect(clubWeek(p)?.title).toBe('Week 17')
    expect(seasonCalendar(p)[0].month).toBe(5)
  })

  it('keeps Toby ahead, and sets each story week’s person just above you', () => {
    const p = { ...startNextAct(afterTheCup()), chapter: 5 } // "Going live": Dex
    expect(opponentRating(p, 'toby')).toBe(1460)
    expect(opponentRating(p, 'dex')).toBe(1415)
    // Fixed members stay where trial night put them.
    expect(opponentRating(p, 'malcolm')).toBe(1520)
  })

  it('ends at the top of the ladder with Toby, then the split', () => {
    let p: Progress = { ...startNextAct(afterTheCup()), chapter: 15 }
    const step = nextStep(p)
    if (step.kind !== 'play') throw new Error('expected a game')
    expect(step.game).toMatchObject({ kind: 'cup-round', opponent: 'priya' })
    p = { ...p, cup: { round: 2, bossRating: 1460, bossAttempts: 0 } }
    const final = nextStep(p)
    if (final.kind !== 'play') throw new Error('expected a game')
    expect(final.game).toMatchObject({ kind: 'boss', opponent: 'toby', label: 'Top of the ladder vs Toby' })
    p = recordGame(p, final.game as PathGame, true, null)
    expect(p.stage).toBe('act-complete')
    expect(p.pendingStory).toContain('scene:split')
    expect(nextStep(p)).toMatchObject({ kind: 'act-complete', nextAct: false })
  })
})
