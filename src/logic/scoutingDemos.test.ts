import { describe, expect, it } from 'vitest'
import { CHARACTERS, LEAGUE_ONLY, PRACTICE_REGULARS } from '../data/characters'
import { LESSONS } from '../data/lessons'
import { SCOUTING } from '../data/scouting'
import { SCOUTING_DEMOS } from '../data/scoutingDemos'
import { THEME_CAPTIONS } from '../data/themes'
import { buildDemo } from './demo'
import { pickScouting } from './scouting'

describe('scouting demos', () => {
  it('exist for every Saturday opponent, at least two for each colour, with legal moves', () => {
    const everyone = [...CHARACTERS, ...LEAGUE_ONLY, ...PRACTICE_REGULARS.filter((c) => c.id === 'terry')]
    for (const c of everyone) {
      for (const colour of ['w', 'b'] as const) {
        const demos = SCOUTING_DEMOS[c.id]?.[colour]
        expect(demos?.length, `${c.id} ${colour}`).toBeGreaterThanOrEqual(2)
        for (const steps of demos!) expect(() => buildDemo(steps), `${c.id} ${colour}`).not.toThrow()
      }
      expect(SCOUTING[c.id]?.styles.length, c.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('use plain words: no move notation in the captions', () => {
    const notation = /\b[KQRBN][a-h]?x?[a-h][1-8]\b|\b[a-h][1-8]\b|O-O/
    for (const demo of Object.values(SCOUTING_DEMOS)) {
      for (const step of [...demo.w, ...demo.b].flat()) expect(step.caption, step.caption).not.toMatch(notation)
    }
  })

  it('never repeats a report: each meeting gets the next one not yet seen', () => {
    let seen: string[] = []
    const shown: string[] = []
    // A best of three (White, Black, White), then the same again another week.
    for (const colour of ['w', 'b', 'w', 'b', 'w', 'b'] as const) {
      const pick = pickScouting('marjorie', colour, seen, SCOUTING_DEMOS.marjorie[colour].length)
      if (pick.demo !== null) shown.push(`${colour}${pick.demo}`)
      seen = [...seen, ...pick.used]
    }
    expect(shown).toEqual(['w0', 'b0', 'w1', 'b1'])
    // Once they're all seen: no demo, and no style line either.
    expect(pickScouting('marjorie', 'w', seen, 2)).toEqual({ demo: null, style: null, used: [] })
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

  it('never repeat: every week has its own topic and drill', () => {
    expect(new Set(LESSONS.map((l) => l.title)).size).toBe(LESSONS.length)
    const drills = LESSONS.flatMap((l) => (l.drill ? [l.drill] : []))
    expect(new Set(drills).size).toBe(drills.length)
  })
})
