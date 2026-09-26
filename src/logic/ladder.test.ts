import { describe, expect, it } from 'vitest'
import { clubLadder, ladderChanges, nextRung, YOU } from './ladder'
import { beginTrial, NEW_PROGRESS, nextStep, recordGame, type Progress } from './path'

/** Through trial night, with the player's rating set to `rating`. */
function withRating(rating: number, chapter = 0): Progress {
  let p = beginTrial(NEW_PROGRESS, 'casual')
  for (let i = 0; i < 5; i++) {
    const step = nextStep(p)
    if (step.kind !== 'play') throw new Error('expected a game')
    p = recordGame(p, step.game, i % 2 === 0, 1100)
  }
  return { ...p, chapter, rating: { ...p.rating!, rating } }
}

describe('the club ladder', () => {
  it('lists the cast and the background members by rating, with the player among them', () => {
    const p = withRating(1200)
    const ladder = clubLadder({ ...p, rating: { ...p.rating!, rating: p.baseline } }, 'Joseph')!
    expect(ladder).toHaveLength(12)
    expect(ladder[0].id).toBe('malcolm') // board one, well above
    expect(ladder.at(-1)!.id).toBe('bill') // a member since 1974, well below
    expect(ladder.find((r) => r.id === YOU)!.name).toBe('Joseph')
    const { above, gap } = nextRung(ladder)
    expect(gap).toBe(above!.rating - p.baseline + 1)
  })

  it('is empty before trial night gives the player a rating', () => {
    expect(clubLadder(NEW_PROGRESS)).toBeNull()
  })

  it('keeps Toby ahead however fast the player climbs; fixed members are passed for good', () => {
    const p = withRating(1200)
    const flying = { ...p, rating: { ...p.rating!, rating: p.baseline + 400 } }
    const ladder = clubLadder(flying)!
    const i = ladder.findIndex((r) => r.id === YOU)
    // Priya (+20) then Toby (+50) are the only ones still above.
    expect(ladder.slice(0, i).map((r) => r.id)).toEqual(['toby', 'priya'])
    const passed = ladderChanges(clubLadder({ ...p, rating: { ...p.rating!, rating: p.baseline } }), ladder).map((n) => n.id)
    expect(passed).toEqual(expect.arrayContaining(['graham', 'malcolm', 'ray']))
    expect(passed).not.toContain('toby')
  })

  it('moves Priya below the player at the story moment, not before', () => {
    const p = withRating(1200)
    const before = clubLadder({ ...p, chapter: 4 })
    const after = clubLadder({ ...p, chapter: 5 })
    expect(ladderChanges(before, after)).toEqual([{ kind: 'passed', id: 'priya', name: 'Priya' }])
  })
})
