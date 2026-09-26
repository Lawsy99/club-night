import { describe, expect, it } from 'vitest'
import { cardId, cardsFromMoments, type ReviewMoment } from './mistakeCards'

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
