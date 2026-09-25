import { describe, expect, it } from 'vitest'
import type { Moment } from './moment'
import { answerCard, dueCards, isDue, newCard, nextDue, qualifiesForDeck, type MistakeCard } from './mistakesDeck'

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

  it('stretches the gap with each success, then retires the card', () => {
    let c = card()
    let now = start
    const gaps: number[] = []
    for (let i = 0; i < 8 && !c.retired; i++) {
      c = answerCard(c, 'first-try', now)
      gaps.push(c.schedule.scheduled_days)
      now = new Date(c.schedule.due)
    }
    expect(gaps[1]).toBeGreaterThan(gaps[0])
    expect(c.retired).toBe(true)
    expect(dueCards([c], new Date(start.getTime() + 1000 * DAY))).toEqual([])
  })

  it('lists due cards oldest first and knows when the next is due', () => {
    const early = card()
    const later = answerCard(card(), 'first-try', start)
    expect(dueCards([later, early], start).map((c) => c.id)).toEqual(['g1:4'])
    expect(nextDue([later])?.getTime()).toBe(new Date(later.schedule.due).getTime())
  })
})
