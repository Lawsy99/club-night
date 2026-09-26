import { describe, expect, it } from 'vitest'
import type { Moment } from './moment'
import {
  answerCard,
  dueCards,
  isDue,
  newCard,
  nextDue,
  planAdditions,
  qualifiesForDeck,
  warmupCards,
  type MistakeCard,
} from './mistakesDeck'

const moment: Moment = {
  fenBefore: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  playerColour: 'w',
  played: 'f3g5',
  playedSan: 'Ng5',
  bestMove: 'f1b5',
  bestCp: 30,
  explanation: 'Your knight on g5 was left undefended.',
}
const DAY = 24 * 60 * 60 * 1000
const start = new Date('2026-09-25T20:00:00Z')
const card = () => newCard(moment, { gameId: 'g1', ply: 4, rating: 'blunder', moveLabel: '3. Ng5??' }, start)

describe('warm-ups', () => {
  // Card from game n, made n days after the start.
  const from = (game: number, ply: number) =>
    newCard(moment, { gameId: `g${game}`, ply, rating: 'blunder', moveLabel: '' }, new Date(start.getTime() + game * DAY))

  it('holds back the last three games and takes older ones, one per game', () => {
    const cards = [from(1, 4), from(1, 8), from(2, 6), from(3, 5), from(4, 3), from(5, 7), from(6, 9)]
    expect(warmupCards(cards).map((c) => c.id)).toEqual(['g1:4', 'g2:6', 'g3:5'])
  })

  it('uses recent games only when there is nothing older', () => {
    const cards = [from(5, 7), from(6, 9), from(6, 11)]
    expect(warmupCards(cards)).toHaveLength(3)
  })

  it('mixes in a missed chance when one is waiting', () => {
    const cards = [from(1, 4), from(2, 6), from(3, 5), { ...from(4, 3), kind: 'missed' as const }, from(5, 7), from(6, 9), from(7, 2)]
    const ids = warmupCards(cards).map((c) => c.id)
    expect(ids).toEqual(['g1:4', 'g2:6', 'g4:3'])
  })

  it('never shows a retired card', () => {
    const cards = [{ ...from(1, 4), retired: true }, from(2, 6)]
    expect(warmupCards(cards).map((c) => c.id)).toEqual(['g2:6'])
  })
})

describe('mistakes deck', () => {
  it('only takes real errors', () => {
    expect(qualifiesForDeck('blunder')).toBe(true)
    expect(qualifiesForDeck('mistake')).toBe(true)
    expect(qualifiesForDeck('inaccuracy')).toBe(false)
  })

  it('makes new cards due straight away, with a stable id', () => {
    expect(card().id).toBe('g1:4')
    expect(isDue(card(), start)).toBe(true)
  })

  it('brings a missed card back soon, and a solved one later', () => {
    const missed = answerCard(card(), 'revealed', start)
    const solved = answerCard(card(), 'first-try', start)
    const dueIn = (c: MistakeCard) => new Date(c.schedule.due).getTime() - start.getTime()
    expect(dueIn(missed)).toBeLessThanOrEqual(2 * DAY)
    expect(dueIn(solved)).toBeGreaterThan(dueIn(missed))
    expect(isDue(solved, start)).toBe(false)
  })

  it('retires a card as soon as it is answered correctly, on any try', () => {
    expect(answerCard(card(), 'first-try', start).retired).toBe(true)
    expect(answerCard(card(), 'second-try', start).retired).toBe(true)
    const c = answerCard(card(), 'first-try', start)
    expect(dueCards([c], new Date(start.getTime() + 1000 * DAY))).toEqual([])
  })

  it('never brings a card back, even when the answer had to be shown (no memory tests)', () => {
    const c = answerCard(card(), 'revealed', start)
    expect(c.retired).toBe(true)
    expect(dueCards([c], new Date(start.getTime() + 2 * DAY))).toHaveLength(0)
  })

  it('never adds the same game move or the same position twice', () => {
    const existing = [card()]
    const sameId = card()
    const samePosition = { ...card(), id: 'g2:10', gameId: 'g2' }
    const fresh = { ...card(), id: 'g3:6', gameId: 'g3', fenBefore: '8/8/8/8/8/8/8/K6k w - - 0 1' }
    expect(planAdditions(existing, [sameId, samePosition, fresh]).add.map((c) => c.id)).toEqual(['g3:6'])
  })

  it('retires the oldest cards when the deck is full', () => {
    const existing = [0, 1, 2].map((i) => ({ ...card(), id: `old:${i}`, fenBefore: `fen${i}`, createdAt: i }))
    const incoming = [{ ...card(), id: 'new:1', fenBefore: 'fenNew', createdAt: 10 }]
    const { add, retire } = planAdditions(existing, incoming, 3)
    expect(add).toHaveLength(1)
    expect(retire.map((c) => c.id)).toEqual(['old:0'])
    expect(retire[0].retired).toBe(true)
  })

  it('lists due cards oldest first and knows when the next is due', () => {
    const early = card()
    const answered = answerCard(card(), 'revealed', start) // seen once: gone
    expect(dueCards([answered, early], start).map((c) => c.id)).toEqual(['g1:4'])
    expect(nextDue([answered])).toBeNull()
  })
})
