import { describe, expect, it } from 'vitest'
import { ACT_1 } from '../data/act1'
import { beginTrial, completeLesson, NEW_PROGRESS, nextStep, recordGame, type Progress } from './path'

/** The game the Next card offers (fails the test if it isn't a game). */
function nextGame(p: Progress) {
  const step = nextStep(p)
  if (step.kind !== 'play') throw new Error(`expected a game, got ${step.kind}`)
  return step
}

function throughTrial(wins = [true, false, true, false, true]): Progress {
  let p = beginTrial(NEW_PROGRESS, 'casual')
  for (const won of wins) p = recordGame(p, nextGame(p).game, won, 1100)
  return p
}

describe('the path', () => {
  it('starts with the welcome question, then trial night', () => {
    expect(nextStep(NEW_PROGRESS).kind).toBe('welcome')
    const p = beginTrial(NEW_PROGRESS, 'casual')
    const first = nextGame(p).game
    expect(first).toMatchObject({ kind: 'trial', opponent: 'marjorie', rating: 1000, stage: 'real' })
  })

  it('sets a rating and the Act 1 baseline after five trial games', () => {
    const p = throughTrial()
    expect(p.stage).toBe('act')
    expect(p.rating?.rating).toBeGreaterThan(900)
    expect(p.baseline).toBe(Math.round(p.rating!.rating))
    expect(p.fixedRatings.marjorie).toBeDefined()
  })

  it('opens each chapter with its lesson', () => {
    const p = throughTrial()
    expect(nextStep(p)).toMatchObject({ kind: 'lesson', chapterId: ACT_1.chapters[0].id, topic: 'Forks in the London' })
  })

  it('runs friendlies: assisted first, then guided, until the match unlocks', () => {
    let p = completeLesson(throughTrial())
    const first = nextGame(p).game
    expect(first).toMatchObject({ kind: 'friendly', stage: 'assisted', opponent: 'marjorie' })
    p = recordGame(p, first, false, null)
    const second = nextGame(p).game
    expect(second).toMatchObject({ kind: 'friendly', stage: 'guided' })
    // Winning a guided friendly unlocks the match.
    p = recordGame(p, second, true, null)
    expect(nextGame(p).game.kind).toBe('match')
  })

  it('unlocks the match after three friendlies, win or lose', () => {
    let p = completeLesson(throughTrial())
    for (let i = 0; i < 3; i++) p = recordGame(p, nextGame(p).game, false, null)
    const step = nextGame(p)
    expect(step.game.kind).toBe('match')
    expect(step.optionalFriendly?.stage).toBe('guided')
  })

  it('friendlies never change the rating; matches do', () => {
    let p = completeLesson(throughTrial())
    const before = p.rating!.rating
    p = recordGame(p, nextGame(p).game, true, null)
    expect(p.rating!.rating).toBe(before)
    for (let i = 0; i < 2; i++) p = recordGame(p, nextGame(p).game, false, null)
    p = recordGame(p, nextGame(p).game, true, null) // the match
    expect(p.rating!.rating).toBeGreaterThan(before)
  })

  it('replays a lost match, then moves to the next chapter on a win', () => {
    let p = completeLesson(throughTrial())
    for (let i = 0; i < 3; i++) p = recordGame(p, nextGame(p).game, false, null)
    const match = nextGame(p).game
    p = recordGame(p, match, false, null)
    expect(nextGame(p).game.kind).toBe('match')
    expect(nextGame(p).note).toMatch(/Replay/)
    p = recordGame(p, match, true, null)
    expect(p.chapter).toBe(1)
    expect(nextStep(p).kind).toBe('lesson')
  })

  it('offers the match straight away against someone already met', () => {
    // Oscar is met in chapter 3; he's also a cup opponent, but check the rule directly.
    let p = completeLesson(throughTrial())
    p = { ...p, met: ['marjorie'] }
    expect(nextGame(p).game.kind).toBe('match')
  })

  it('runs the cup: three rounds, then the boss; a boss loss means qualifying again', () => {
    let p: Progress = { ...throughTrial(), chapter: ACT_1.chapters.length, lessonDone: true }
    const baseline = p.baseline
    const ratings: number[] = []
    for (let r = 0; r < 3; r++) {
      const round = nextGame(p).game
      expect(round.kind).toBe('cup-round')
      ratings.push(round.rating)
      p = recordGame(p, round, true, null)
    }
    expect(ratings[0]).toBeLessThan(ratings[2]) // −75, −50, −25
    const boss = nextGame(p).game
    expect(boss).toMatchObject({ kind: 'boss', opponent: 'toby' })
    expect(boss.rating).toBe(Math.round((baseline + 25) / 5) * 5)

    p = recordGame(p, boss, false, null)
    expect(nextGame(p).game.kind).toBe('cup-round') // back to round 1
    expect(p.cup?.bossAttempts).toBe(1)
    // Win through again; the boss is exactly as strong as before.
    for (let r = 0; r < 3; r++) p = recordGame(p, nextGame(p).game, true, null)
    expect(nextGame(p).game.rating).toBe(boss.rating)
    p = recordGame(p, nextGame(p).game, true, null)
    expect(nextStep(p).kind).toBe('act-complete')
  })

  it('offers a study friendly against the boss after two losses', () => {
    let p: Progress = { ...throughTrial(), chapter: ACT_1.chapters.length, lessonDone: true }
    for (let attempt = 0; attempt < 2; attempt++) {
      for (let r = 0; r < 3; r++) p = recordGame(p, nextGame(p).game, true, null)
      p = recordGame(p, nextGame(p).game, false, null)
    }
    for (let r = 0; r < 3; r++) p = recordGame(p, nextGame(p).game, true, null)
    expect(nextGame(p).optionalFriendly).toMatchObject({ kind: 'friendly', stage: 'assisted', opponent: 'toby' })
    expect(nextGame(p).targetedPuzzles).toBeNull()
    // A third loss adds the targeted puzzle set on his openings.
    p = recordGame(p, nextGame(p).game, false, null)
    for (let r = 0; r < 3; r++) p = recordGame(p, nextGame(p).game, true, null)
    expect(nextGame(p).targetedPuzzles?.openings).toContain('najdorf')
  })
})
