import { describe, expect, it } from 'vitest'
import { cardId, cardsFromMoments, isMissedChance, type ReviewMoment } from './mistakeCards'

describe('missed chances', () => {
  it('are when their move handed you a real advantage and you let it go', () => {
    expect(isMissedChance(20, 350)).toBe(true) // level, then they blundered
    expect(isMissedChance(400, 450)).toBe(false) // you were already winning
    expect(isMissedChance(0, 120)).toBe(false) // only a small chance
  })
})

const moment = (ply: number, rating: ReviewMoment['rating']): ReviewMoment => ({
  fenBefore: '8/8/8/8/8/8/8/K6k w - - 0 1',
  playerColour: 'w',
  played: 'a1a2',
  playedSan: 'Ka2',
  bestMove: 'a1b1',
  bestCp: 0,
  explanation: '',
  ply,
  rating,
  moveLabel: `${ply}. Ka2`,
})

describe('warm-up positions from a game', () => {
  it('keeps only real errors, blunders first, and ids match the review’s moments', () => {
    const cards = cardsFromMoments({ id: 'g1' }, [moment(4, 'mistake'), moment(10, 'blunder'), moment(12, 'inaccuracy')])
    expect(cards.map((c) => c.id)).toEqual([cardId('g1', 10), cardId('g1', 4)])
  })
})
