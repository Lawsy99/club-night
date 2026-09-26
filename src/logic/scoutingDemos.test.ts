import { describe, expect, it } from 'vitest'
import { CHARACTERS } from '../data/characters'
import { LESSONS } from '../data/lessons'
import { SCOUTING_DEMOS } from '../data/scoutingDemos'
import { THEME_CAPTIONS } from '../data/themes'
import { buildDemo } from './demo'

describe('scouting demos', () => {
  it('exist for every Act 1 character, for both colours, with legal moves', () => {
    for (const c of CHARACTERS) {
      for (const colour of ['w', 'b'] as const) {
        const steps = SCOUTING_DEMOS[c.id]?.[colour]
        expect(steps, `${c.id} ${colour}`).toBeDefined()
        expect(() => buildDemo(steps!), `${c.id} ${colour}`).not.toThrow()
      }
    }
  })

  it('use plain words: no move notation in the captions', () => {
    const notation = /\b[KQRBN][a-h]?x?[a-h][1-8]\b|\b[a-h][1-8]\b|O-O/
    for (const demo of Object.values(SCOUTING_DEMOS)) {
      for (const step of [...demo.w, ...demo.b]) expect(step.caption, step.caption).not.toMatch(notation)
    }
  })
})

describe('lessons', () => {
  it('are short, and every theme has a caption', () => {
    for (const l of LESSONS) {
      expect(l.intro.length, l.id).toBeLessThanOrEqual(160)
      // Opening lessons have no puzzles (and so no theme); the rest need a caption.
      if (l.count > 0) expect(l.themes.some((t) => THEME_CAPTIONS[t]), l.id).toBe(true)
      else expect(l.kind, l.id).toBe('opening')
    }
  })
})
