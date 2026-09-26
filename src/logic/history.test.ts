import { describe, expect, it } from 'vitest'
import { describeTogether, historyWith } from './history'

describe('your history with each person', () => {
  it('counts games together, newest first', () => {
    const h = historyWith([
      { opponent: 'marjorie', result: 'lost' },
      { opponent: 'marjorie', result: 'won' },
      { opponent: 'dex', result: 'drew' },
    ])
    expect(h.marjorie).toEqual({ played: 2, wins: 1, losses: 1, draws: 0, last: 'lost' })
    expect(describeTogether(h.marjorie, 'she')).toBe('2 games. You’ve won 1, lost 1. Last time, she won.')
    expect(describeTogether(h.dex, 'he')).toBe('1 game. You’ve won 0, lost 0, drawn 1. Last time, a draw.')
  })

  it('says so when you have never played', () => {
    expect(describeTogether(undefined)).toBe('You haven’t played yet.')
  })
})
