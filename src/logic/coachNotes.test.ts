import { describe, expect, it } from 'vitest'
import { coachNotes, gameErrorKinds } from './coachNotes'
import { parseLine } from './openingBook'
import type { PositionEval } from './review'

// White drops a knight (3.Ng5?? Qxg5) and then a bishop (5.Bxf7+?? Kxf7).
const moves = parseLine('1. e4 e5 2. Nf3 Nc6 3. Ng5 Qxg5 4. Bc4 Qxg2 5. Bxf7+ Kxf7 6. Qf3+ Qxf3 7. a3 Qxe4+ 8. Kf1 Nf6')
const cps = [30, 30, 30, 30, 30, -300, -300, -300, -350, -650, -650, -650, -650, -650, -650, -650, -650]
const best: Record<number, string> = { 4: 'd2d4', 5: 'd8g5', 8: 'd2d3', 9: 'e8f7' }
const evals: PositionEval[] = cps.map((cp, i) => ({ cp, bestMove: best[i] ?? null }))

describe("Pemberton's notes after a game", () => {
  it('sorts mistakes into kinds', () => {
    expect(gameErrorKinds(moves, evals, 'w')).toEqual(['undefended', 'undefended'])
  })

  it('names the kind of mistake when it happens more than once', () => {
    const notes = coachNotes({ moves, evals, player: 'w', won: false })
    expect(notes).toContain('Twice you left a piece where it could be taken for nothing. Before every move: what’s defended?')
  })

  it('notices a habit across games first', () => {
    const notes = coachNotes({ moves, evals, player: 'w', won: false, recent: [['undefended'], ['undefended', 'fork']] })
    expect(notes[0]).toBe('That’s the third game in a row with a piece left undefended. It’s the one thing to fix this week.')
  })

  it('points out a win thrown away', () => {
    // The same game from Black's side, but Black didn't win it.
    const notes = coachNotes({ moves, evals, player: 'b', won: null })
    expect(notes[0]).toMatch(/^You were winning by move 3\. A won position still has to be won/)
  })

  it('stays quiet about games too short to say anything', () => {
    expect(coachNotes({ moves: moves.slice(0, 8), evals: evals.slice(0, 9), player: 'w', won: false })).toEqual([])
  })
})
