import { describe, expect, it } from 'vitest'
import { newMilestones, noticeFor, type MilestoneFacts } from './milestones'

const facts = (over: Partial<MilestoneFacts> = {}): MilestoneFacts => ({
  won: true,
  rated: true,
  opponent: 'dex',
  opponentName: 'Dex',
  opponentRating: 1100,
  ratingBefore: 1150,
  ratingAfter: 1160,
  theirStreakBefore: 0,
  regularsBeaten: ['dex'],
  regulars: ['marjorie', 'dex'],
  fixedRatings: { marjorie: 1000 },
  errors: null,
  ...over,
})

const ids = (f: MilestoneFacts, reached: string[] = []) => newMilestones(f, reached).map((m) => m.id)

describe('milestones', () => {
  it('marks a first win against a higher-rated player, once', () => {
    expect(ids(facts({ opponentRating: 1200 }))).toContain('beat-higher')
    expect(ids(facts({ opponentRating: 1200 }), ['beat-higher'])).not.toContain('beat-higher')
    expect(ids(facts({ opponentRating: 1200, won: false }))).not.toContain('beat-higher')
  })

  it('marks rating hundreds and passing a fixed character by 200', () => {
    expect(ids(facts({ ratingBefore: 1195, ratingAfter: 1204 }))).toEqual(['rating-1200', 'passed:marjorie'])
    expect(ids(facts({ rated: false, ratingBefore: 1195, ratingAfter: 1204 }))).toEqual([])
  })

  it('marks breaking a losing run, beating every regular, and a clean game', () => {
    expect(ids(facts({ theirStreakBefore: 3 }))).toContain('streak-broken:dex')
    expect(ids(facts({ regularsBeaten: ['marjorie', 'dex'] }))).toContain('beat-every-regular')
    expect(ids(facts({ errors: 0 }))).toContain('clean-game')
    expect(ids(facts({ errors: 2 }))).not.toContain('clean-game')
  })

  it('tells the characters what to notice', () => {
    expect(noticeFor(newMilestones(facts({ ratingBefore: 1195, ratingAfter: 1204 }), []))).toBe('rating')
    expect(noticeFor([])).toBeNull()
  })
})
