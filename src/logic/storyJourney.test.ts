// The whole story, start to finish: a player who wins everything, from trial
// night to the top of the ladder. Every moment should play once, in order,
// and be showable.
import { describe, expect, it } from 'vitest'
import { ACTS } from '../data/acts'
import { beginTrial, completeLesson, NEW_PROGRESS, nextStep, recordGame, startNextAct, storyPlayed, type Progress } from './path'
import { storyFor } from './storyContent'

function playThrough(): string[] {
  let p: Progress = beginTrial(NEW_PROGRESS, 'casual', undefined, 'Jo')
  const played: string[] = []
  for (let i = 0; i < 3000; i++) {
    // Story moments play before anything else, as on Home.
    for (const id of p.pendingStory ?? []) {
      played.push(id)
      p = storyPlayed(p, id)
    }
    const step = nextStep(p)
    if (step.kind === 'lesson') p = completeLesson(p)
    else if (step.kind === 'play') p = recordGame(p, step.game, true, null)
    else if (step.kind === 'act-complete') {
      if (!step.nextAct) return played
      p = startNextAct(p)
    } else throw new Error(`unexpected step ${step.kind}`)
  }
  throw new Error('never finished')
}

describe('the story, start to finish', () => {
  const played = playThrough()

  it('plays every moment once, and every one can be shown', () => {
    expect(new Set(played).size).toBe(played.length)
    for (const id of played) expect(storyFor(id), id).not.toBeNull()
  })

  it('has a closing moment for every week of every act', () => {
    for (const ch of ACTS.flatMap((a) => a.chapters)) expect(played, ch.id).toContain(`wayout:${ch.id}`)
  })

  it('opens with trial night and ends with the split', () => {
    expect(played[0]).toBe('scene:trial-night')
    expect(played.at(-1)).toBe('scene:split')
  })

  it('keeps the big moments in order', () => {
    const at = (id: string) => played.indexOf(id)
    expect(at('wayout:c3')).toBeLessThan(at('scene:month-1'))
    expect(at('wayout:w12')).toBeLessThan(at('scene:month-3'))
    expect(at('scene:cup-won')).toBe(at('scene:cup') - 1)
    expect(at('scene:cup')).toBeLessThan(at('wayout:a2-1'))
    expect(at('study:prep')).toBe(at('wayout:a2-9') + 1)
  })
})
