// Chess accuracy (Joseph, Sep 2026: "are forks common from the London?").
// Every lesson tied to an opening must teach a theme that really does turn up
// in that opening more than it does in chess generally, measured on the
// bundled Lichess puzzles. And every lesson must have plenty of puzzles.
import { describe, expect, it } from 'vitest'
import { LESSONS } from '../data/lessons'
import type { PuzzleRow } from './puzzles'
import puzzlesText from '../../public/puzzles/puzzles.json?raw'

const rows = JSON.parse(puzzlesText) as PuzzleRow[]
const has = (row: PuzzleRow, theme: string) => row[4].split(' ').includes(theme)
const share = (set: PuzzleRow[], themes: string[]) => set.filter((r) => themes.some((t) => has(r, t))).length / set.length

describe('lessons are true to chess', () => {
  // (Opening lessons have no puzzles: their drill is playing the opening.)
  for (const lesson of LESSONS.filter((l) => l.count > 0)) {
    it(`${lesson.title}: enough real puzzles to learn from`, () => {
      const pool = rows.filter(
        (r) => lesson.themes.some((t) => has(r, t)) && (!lesson.openings || lesson.openings.includes(r[5])),
      )
      expect(pool.length).toBeGreaterThanOrEqual(25)
    })

    if (lesson.openings) {
      it(`${lesson.title}: the theme is characteristic of the opening`, () => {
        const inOpening = rows.filter((r) => lesson.openings!.includes(r[5]))
        const lift = share(inOpening, lesson.themes) / share(rows, lesson.themes)
        // At least 10% more common than in chess generally.
        expect(lift).toBeGreaterThan(1.1)
      })
    }
  }
})
