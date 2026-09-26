import { describe, expect, it } from 'vitest'
import { ACT_1 } from '../data/act1'
import {
  beginTrial,
  completeLesson,
  drawRule,
  NEW_PROGRESS,
  nextStep,
  opponentRating,
  practiceOpponent,
  recordGame,
  upgradeProgress,
  wantsWarmup,
  type Progress,
} from './path'

/** The game the Next card offers (fails the test if it isn't a game). */
function nextGame(p: Progress) {
  const step = nextStep(p)
  if (step.kind !== 'play') throw new Error(`expected a game, got ${step.kind}`)
  return step
}

/** Past this week's lesson and coached game: practice night is next. */
function readyForPractice(): Progress {
  return { ...completeLesson(throughTrial()), coachingDone: true }
}

/** Four placement games, then Toby's game (lost, as intended). */
function throughTrial(wins = [true, false, true, false]): Progress {
  let p = beginTrial(NEW_PROGRESS, 'casual')
  for (const won of wins) p = recordGame(p, nextGame(p).game, won, 1100)
  return recordGame(p, nextGame(p).game, false, 400)
}

describe('draws', () => {
  it('count in practice, are void in the best of three, and are replayed in knockouts', () => {
    expect(drawRule('friendly')).toBe('counts')
    expect(drawRule('coaching')).toBe('counts')
    expect(drawRule('match')).toBe('void')
    expect(drawRule('cup-round')).toBe('replay')
    expect(drawRule('boss')).toBe('replay')
    expect(drawRule('trial')).toBe('replay')
    expect(drawRule('exhibition')).toBe('ends')
  })

  it('a drawn practice game still moves practice night on', () => {
    const p = readyForPractice()
    const first = nextGame(p).game
    const after = recordGame(p, first, false, null)
    expect(after.friendlies.played).toBe(1)
    expect(nextGame(after).game.label).toContain('Practice game 2')
  })
})

describe('the path', () => {
  it('starts with the welcome question, then trial night', () => {
    expect(nextStep(NEW_PROGRESS).kind).toBe('welcome')
    const p = beginTrial(NEW_PROGRESS, 'casual')
    const first = nextGame(p).game
    expect(first).toMatchObject({ kind: 'trial', opponent: 'marjorie', rating: 1000, stage: 'real' })
  })

  it('sets a rating and the Act 1 baseline after four placement games', () => {
    const p = throughTrial()
    expect(p.stage).toBe('act')
    expect(p.rating?.rating).toBeGreaterThan(900)
    expect(p.baseline).toBe(Math.round(p.rating!.rating))
    expect(p.fixedRatings.marjorie).toBeDefined()
  })

  it("ends trial night with Toby at full strength, which doesn't count", () => {
    let p = beginTrial(NEW_PROGRESS, 'casual')
    for (const won of [true, false, true, false]) p = recordGame(p, nextGame(p).game, won, 1100)
    // Rated after four games, but the night isn't over.
    expect(p.stage).toBe('trial')
    const rating = p.rating
    expect(rating).not.toBeNull()
    const step = nextGame(p)
    expect(step.game).toMatchObject({ kind: 'exhibition', opponent: 'toby', stage: 'real' })
    const after = recordGame(p, step.game, false, 300)
    expect(after.stage).toBe('act')
    expect(after.rating).toEqual(rating)
    expect(after.recentReal).toEqual([])
  })

  it('finishes an older save that stopped after four trial games', () => {
    let p = beginTrial(NEW_PROGRESS, 'casual')
    for (const won of [true, false, true, false]) p = recordGame(p, nextGame(p).game, won, 1100)
    const oldSave: Progress = { ...p, rating: null }
    const after = recordGame(oldSave, nextGame(oldSave).game, false, null)
    expect(after.stage).toBe('act')
    expect(after.rating?.rating).toBeGreaterThan(900)
  })

  it('warms up with the mistakes deck before a lesson, once per chapter, when cards are due', () => {
    const p = throughTrial()
    const next = nextStep(p)
    expect(wantsWarmup(p, next, 5)).toBe(true)
    expect(wantsWarmup(p, next, 1)).toBe(true)
    expect(wantsWarmup(p, next, 0)).toBe(false) // nothing waiting
    expect(wantsWarmup({ ...p, warmupDone: ACT_1.chapters[0].id }, next, 5)).toBe(false)
    // Not mid-chapter (the lesson is done, games are next).
    const midChapter = completeLesson(p)
    expect(wantsWarmup(midChapter, nextStep(midChapter), 5)).toBe(false)
  })

  it('opens each chapter with its lesson', () => {
    const p = throughTrial()
    expect(nextStep(p)).toMatchObject({ kind: 'lesson', chapterId: ACT_1.chapters[0].id, topic: 'Forks in the London' })
  })

  it('follows the lesson with a coached game against Pemberton, at your level, full help, unrated', () => {
    let p = completeLesson(throughTrial())
    const coached = nextGame(p).game
    expect(coached).toMatchObject({ kind: 'coaching', opponent: 'pemberton', stage: 'assisted' })
    expect(coached.rating).toBe(Math.round(p.rating!.rating / 5) * 5)
    const before = p.rating!.rating
    p = recordGame(p, coached, false, null)
    expect(p.rating!.rating).toBe(before)
    expect(nextGame(p).game.kind).toBe('friendly')
  })

  it('runs practice night: the week’s person, then one stronger and one weaker', () => {
    let p = readyForPractice()
    const first = nextGame(p).game
    expect(first).toMatchObject({ kind: 'friendly', stage: 'guided', opponent: 'marjorie' })
    p = recordGame(p, first, true, null)
    const second = nextGame(p).game
    expect(second.kind).toBe('friendly')
    expect(second.opponent).not.toBe('marjorie')
    expect(second.rating).toBeGreaterThan(p.rating!.rating) // someone stronger
    p = recordGame(p, second, true, null)
    const third = nextGame(p).game
    expect(third.rating).toBeLessThanOrEqual(p.rating!.rating) // someone weaker
    // Malcolm only comes for league nights.
    for (const g of [second, third]) expect(g.opponent).not.toBe('malcolm')
    p = recordGame(p, third, false, null)
    expect(nextGame(p).game.kind).toBe('match')
  })

  it('unlocks the match after three practice games, win or lose', () => {
    let p = readyForPractice()
    for (let i = 0; i < 3; i++) p = recordGame(p, nextGame(p).game, false, null)
    const step = nextGame(p)
    expect(step.game.kind).toBe('match')
    expect(step.optionalFriendly?.stage).toBe('guided')
  })

  it('keeps a rating history: the starting rating, then each rated game', () => {
    let p = completeLesson(throughTrial())
    expect(p.ratingHistory).toHaveLength(1)
    p = recordGame(p, { ...nextGame(p).game, kind: 'match' }, true, null)
    expect(p.ratingHistory).toHaveLength(2)
    expect(p.ratingHistory!.at(-1)!.rating).toBe(Math.round(p.rating!.rating))
  })

  it('friendlies never change the rating; match games do', () => {
    let p = readyForPractice()
    const before = p.rating!.rating
    for (let i = 0; i < 3; i++) p = recordGame(p, nextGame(p).game, true, null)
    expect(p.rating!.rating).toBe(before)
    p = recordGame(p, nextGame(p).game, true, null) // match game 1
    expect(p.rating!.rating).toBeGreaterThan(before)
  })

  it('plays Saturday as best of three: first to two; losing two replays it from 0–0', () => {
    let p = readyForPractice()
    for (let i = 0; i < 3; i++) p = recordGame(p, nextGame(p).game, false, null)
    p = recordGame(p, nextGame(p).game, true, null)
    expect(nextGame(p).game.label).toMatch(/game 2 · 1–0/)
    p = recordGame(p, nextGame(p).game, false, null)
    p = recordGame(p, nextGame(p).game, false, null)
    // Lost 1–2: the series starts again.
    expect(p.series).toEqual({ wins: 0, losses: 0 })
    expect(nextGame(p).note).toMatch(/Best of three again/)
    p = recordGame(p, nextGame(p).game, true, null)
    p = recordGame(p, nextGame(p).game, true, null)
    expect(p.chapter).toBe(1)
    expect(p.coachingDone).toBe(false)
    expect(nextStep(p).kind).toBe('lesson')
  })

  it('scaling characters keep the story’s distance from the player; fixed ones never move', () => {
    const p = { ...throughTrial(), rating: { rating: 1200, deviation: 100, volatility: 0.06 } }
    const improved = { ...p, rating: { ...p.rating, rating: 1500 } }
    // Toby stays 50 ahead however fast the player improves.
    expect(opponentRating(p, 'toby')).toBe(1250)
    expect(opponentRating(improved, 'toby')).toBe(1550)
    // Fixed characters don't follow: the player climbs past them.
    expect(opponentRating(improved, 'graham')).toBe(opponentRating(p, 'graham'))
    // Priya is just above until the player has beaten her (her story week is week 8), then just below.
    expect(opponentRating({ ...p, chapter: 7 }, 'priya')).toBe(1220)
    expect(opponentRating({ ...p, chapter: 8 }, 'priya')).toBe(1180)
  })

  it('brings older saves up to date with the fixed characters’ new ratings, once', () => {
    const p = throughTrial()
    const old: Progress = { ...p, fixedVersion: undefined, trialStart: undefined, fixedRatings: { ...p.fixedRatings, marjorie: 1 } }
    const upgraded = upgradeProgress(old)
    expect(upgraded.fixedRatings.marjorie).toBe(Math.round((p.baseline - 60) / 5) * 5)
    expect(upgradeProgress(upgraded)).toBe(upgraded)
  })

  it('brings your rival to practice night now and then', () => {
    const p = { ...readyForPractice(), chapter: 2, met: ['marjorie', 'dex'] }
    expect(practiceOpponent(p, 1)).toBe('toby')
    expect(practiceOpponent({ ...p, chapter: 3 }, 1)).not.toBe('toby')
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
    // At club ratings, harder each round (Clive, Oscar, Priya), then Toby ahead of you.
    expect(ratings[1]).toBeLessThan(ratings[2])
    const boss = nextGame(p).game
    expect(boss).toMatchObject({ kind: 'boss', opponent: 'toby' })
    expect(boss.rating).toBeGreaterThan(p.rating!.rating)
    expect(boss.rating).toBeGreaterThan(ratings[2])
    expect(baseline).toBeGreaterThan(0)

    p = recordGame(p, boss, false, null)
    expect(nextGame(p).game.kind).toBe('cup-round') // back to round 1
    expect(p.cup?.bossAttempts).toBe(1)
    // Win through again; the boss is never easier than before.
    for (let r = 0; r < 3; r++) p = recordGame(p, nextGame(p).game, true, null)
    expect(nextGame(p).game.rating).toBeGreaterThanOrEqual(boss.rating)
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
