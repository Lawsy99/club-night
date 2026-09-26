import { describe, expect, it } from 'vitest'
import { ACT_1 } from '../data/act1'
import { CUTSCENES } from '../data/cutscenes'
import { WEEK_STORY } from '../data/weekStory'
import { storyFor } from './storyContent'
import { storyAfterCup, storyAfterWin } from './storyQueue'
import { NEW_PROGRESS, recordGame, storyPlayed, weekBeat, type PathGame, type Progress } from './path'

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
  it('has a Tuesday, a Thursday and a way out for every week', () => {
    for (const ch of ACT_1.chapters) {
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
    expect(storyAfterCup()).toEqual(['scene:cup'])
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

  it('every cutscene plays after a real week (or the cup) and can be shown', () => {
    for (const c of CUTSCENES) {
      expect(c.after === 'cup' || ACT_1.chapters.some((ch) => ch.id === c.after), c.id).toBe(true)
      expect(storyFor(`scene:${c.id}`)?.lines.length).toBeGreaterThan(0)
    }
  })
})
