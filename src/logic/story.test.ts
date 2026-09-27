import { describe, expect, it } from 'vitest'
import { ACTS } from '../data/acts'
import { CUTSCENES } from '../data/cutscenes'
import { WEEK_STORY } from '../data/weekStory'
import { storyFor } from './storyContent'
import { storyAfterFinal, storyAfterWin } from './storyQueue'
import { beginTrial, NEW_PROGRESS, nextStep, recordGame, storyPlayed, weekBeat, type PathGame, type Progress } from './path'

const nextGame = (p: Progress) => {
  const step = nextStep(p)
  if (step.kind !== 'play') throw new Error(`expected a game, got ${step.kind}`)
  return step
}

const inWeek = (chapter: number, over: Partial<Progress> = {}): Progress => ({
  ...NEW_PROGRESS,
  stage: 'act',
  rating: { rating: 1200, deviation: 80, volatility: 0.06 },
  baseline: 1200,
  chapter,
  lessonDone: true,
  ...over,
})

describe('the story through the week', () => {
  it('has a Tuesday, a Thursday and a way out for every week of every act', () => {
    for (const ch of ACTS.flatMap((a) => a.chapters)) {
      expect(WEEK_STORY[ch.id], ch.id).toBeDefined()
      expect(WEEK_STORY[ch.id].wayOut.length).toBeGreaterThan(0)
    }
  })

  it('shows Tuesday after the coached game, then Thursday after practice night', () => {
    expect(weekBeat(inWeek(0))).toBeNull()
    expect(weekBeat(inWeek(0, { coachingDone: true }))?.day).toBe('Tuesday')
    expect(weekBeat(inWeek(0, { coachingDone: true, friendlies: { played: 3, wonGuided: false } }))?.day).toBe('Thursday')
  })

  it('plays the way out, then the month’s cutscene, after winning the best of three', () => {
    expect(storyAfterWin('c1')).toEqual(['wayout:c1'])
    expect(storyAfterWin('c3')).toEqual(['wayout:c3', 'scene:month-1'])
    // The cup: the honours board starts again, then the ladder goes up.
    expect(storyAfterFinal(1)).toEqual(['scene:cup-won', 'scene:cup'])
  })

  it('says what comes next at the end of each week', () => {
    expect(storyFor('wayout:c1')?.next).toBe('Week 2 · The streamer')
    expect(storyFor('wayout:w15')?.next).toBe('Week 16 · Cup week')
    expect(storyFor('wayout:a2-1')?.next).toBe('Week 18 · Captain')
  })

  it('opens Toby’s study straight after his message', () => {
    expect(storyAfterWin('a2-9')).toEqual(['wayout:a2-9', 'study:prep'])
    expect(storyFor('study:prep')?.study).toBe(true)
  })

  it('ends trial night with a scene, whatever happened against Toby', () => {
    let p = beginTrial(NEW_PROGRESS, 'casual')
    for (const won of [true, false, true, false]) p = recordGame(p, nextGame(p).game, won, 1100)
    for (const won of [true, false]) {
      expect(recordGame(p, nextGame(p).game, won, 300).pendingStory).toEqual(['scene:trial-night'])
    }
  })

  it('queues them when the series is won, and clears them once played', () => {
    const match: PathGame = { kind: 'match', opponent: 'oscar', rating: 1100, stage: 'real', label: '', location: '', chapter: 'c3' }
    let p = inWeek(3, { coachingDone: true, friendlies: { played: 3, wonGuided: false }, series: { wins: 1, losses: 0 } })
    p = recordGame(p, match, true, null)
    expect(p.pendingStory).toEqual(['wayout:c3', 'scene:month-1'])
    p = storyPlayed(p, 'wayout:c3')
    expect(p.pendingStory).toEqual(['scene:month-1'])
    expect(p.storySeen).toEqual(['wayout:c3'])
  })

  it('every cutscene plays after trial night, a real week or an act’s final, and can be shown', () => {
    for (const c of CUTSCENES) {
      const final = /^final:(\d)$/.exec(c.after)
      const known = c.after === 'trial' || (final ? Number(final[1]) <= ACTS.length : ACTS.some((a) => a.chapters.some((ch) => ch.id === c.after)))
      expect(known, c.id).toBe(true)
      expect(storyFor(`scene:${c.id}`)?.lines.length).toBeGreaterThan(0)
    }
  })
})
