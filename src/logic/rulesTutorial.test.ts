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

  it('takes the queen for nothing in the piece-values step (nothing can take back)', () => {
    const step = RULES_STEPS.find((s) => s.title === 'What pieces are worth')!
    const chess = new Chess(step.fen)
    chess.move({ from: 'd1', to: step.target })
    expect(chess.moves({ verbose: true }).some((m) => m.to === step.target)).toBe(false)
  })
})
