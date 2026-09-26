import { describe, expect, it } from 'vitest'
import { clubLadder, ladderChanges, nextRung, YOU } from './ladder'
import { beginTrial, NEW_PROGRESS, nextStep, recordGame, type Progress } from './path'

/** Through trial night to Act 1, with a rating equal to the baseline. */
function inAct1(): Progress {
  let p = beginTrial(NEW_PROGRESS, 'casual')
  for (let i = 0; i < 5; i++) {
    const step = nextStep(p)
    if (step.kind !== 'play') throw new Error('expected a game')
    p = recordGame(p, step.game, i % 2 === 0, 1100)
  }
  return { ...p, rating: { ...p.rating!, rating: p.baseline } }
}

describe('the club ladder', () => {
  it('lists everyone by rating, with the player among them', () => {
    const ladder = clubLadder(inAct1(), 'Joseph')!
    expect(ladder).toHaveLength(8)
    // Graham (fixed) and Toby share the top at baseline +50.
    expect(ladder.slice(0, 2).map((r) => r.id).sort()).toEqual(['graham', 'toby'])
    const you = ladder.find((r) => r.id === YOU)!
    expect(you.name).toBe('Joseph')
    // Priya (baseline +0, rounded to 5) is next up; the gap is what it takes to get strictly past.
    const { place, above, gap } = nextRung(ladder)
    expect(above?.id).toBe('priya')
    expect(gap).toBe(above!.rating - you.rating + 1)
    expect(place).toBe(4)
  })

  it('is empty before trial night gives the player a rating', () => {
    expect(clubLadder(NEW_PROGRESS)).toBeNull()
  })

  it('climbs as the rating rises, and says who was passed', () => {
    const p = inAct1()
    const before = clubLadder(p)
    const after = clubLadder({ ...p, rating: { ...p.rating!, rating: p.baseline + 60 } })
    expect(ladderChanges(before, after).map((n) => `${n.kind}:${n.id}`).sort()).toEqual([
      'passed:graham',
      'passed:priya',
      'passed:toby',
    ])
  })

  it('notices when a growing player moves above you', () => {
    const p = inAct1()
    const later = { ...p, chapter: 7, rating: { ...p.rating!, rating: p.baseline - 70 } }
    const earlier = { ...later, chapter: 0 }
    // Dex (baseline −100) grows 5 a chapter: after 7 chapters he's at −65, above you at −70.
    expect(ladderChanges(clubLadder(earlier), clubLadder(later))).toContainEqual({ kind: 'passed-by', id: 'dex', name: 'Dex' })
  })
})
