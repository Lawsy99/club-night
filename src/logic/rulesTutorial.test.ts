import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { RULES_STEPS } from '../data/rulesTutorial'

describe('the rules walkthrough', () => {
  it('every task can be done in one legal move', () => {
    for (const step of RULES_STEPS) {
      const chess = new Chess(step.fen)
      const ways = chess.moves({ verbose: true }).filter((m) => {
        if (step.target !== 'mate') return m.to === step.target
        const c = new Chess(step.fen)
        c.move(m)
        return c.isCheckmate()
      })
      expect(ways.length, step.title).toBeGreaterThan(0)
    }
  })
})
