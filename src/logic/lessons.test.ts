import { describe, expect, it } from 'vitest'
import { ACT_1 } from '../data/act1'
import { LESSONS, lessonLevel } from '../data/lessons'
import { lessonFrames } from './lessons'

describe('lessons', () => {
  it('have a lesson for every Act 1 chapter', () => {
    for (const ch of ACT_1.chapters) expect(LESSONS.map((l) => l.id)).toContain(ch.id)
  })

  it('play only legal moves on the demonstration board, in every version', () => {
    for (const lesson of LESSONS) {
      for (const level of ['beginner', 'club', 'advanced'] as const) {
        const version = lesson[level]
        expect(() => lessonFrames(version.bubbles), `${lesson.id} ${level}`).not.toThrow()
        expect(version.bubbles.length, `${lesson.id} ${level}`).toBeGreaterThanOrEqual(3)
        expect(version.bubbles.length, `${lesson.id} ${level}`).toBeLessThanOrEqual(5)
        expect(version.puzzles.count).toBeGreaterThanOrEqual(3)
        expect(version.puzzles.count).toBeLessThanOrEqual(5)
      }
    }
  })

  it('picks the version by strength', () => {
    expect(lessonLevel(700)).toBe('beginner')
    expect(lessonLevel(1100)).toBe('club')
    expect(lessonLevel(1600)).toBe('advanced')
  })

  it('shows the position after each bubble', () => {
    const frames = lessonFrames(LESSONS[0].club.bubbles)
    expect(frames[0].lastMove).toEqual({ from: 'e2', to: 'e3' })
    expect(frames[2].fen).toContain(' w ') // after ...Qb6, White to move
  })
})
