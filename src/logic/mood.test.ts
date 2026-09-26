import { describe, expect, it } from 'vitest'
import { moodFor } from './mood'

describe('faces follow the game', () => {
  const toby = { winning: 'smug', losing: 'annoyed' } as const

  it('stays neutral while the game is in the balance', () => {
    expect(moodFor(toby, 0)).toBe('neutral')
    expect(moodFor(toby, 120)).toBe('neutral')
    expect(moodFor(toby, null)).toBe('neutral')
  })

  it("shows each character's own winning and losing look", () => {
    expect(moodFor(toby, 300)).toBe('smug')
    expect(moodFor(toby, -300)).toBe('annoyed')
    expect(moodFor({ winning: 'pleased', losing: 'neutral' }, -900)).toBe('neutral') // Clive
  })
})
