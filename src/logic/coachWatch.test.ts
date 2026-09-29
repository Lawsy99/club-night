import { describe, expect, it } from 'vitest'
import { DEFAULT_WATCH, watchLevel, watchNote } from './coachWatch'

describe('how closely Pemberton watches', () => {
  it('watches less as blunders drop', () => {
    expect(watchLevel([2, 2, 1])).toBe(3)
    expect(watchLevel([1, 1, 0])).toBe(1)
    expect(watchLevel([0, 0, 0, 1])).toBe(0)
    expect(watchLevel([3])).toBe(DEFAULT_WATCH)
  })

  it('says so when it changes, and only then', () => {
    expect(watchNote(2, 1)).toMatch(/stepping in less/)
    expect(watchNote(1, 0)).toMatch(/stopped checking/)
    expect(watchNote(1, 2)).toMatch(/closer eye/)
    expect(watchNote(2, 2)).toBeNull()
    expect(watchNote(undefined, 1)).toBeNull()
  })
})
