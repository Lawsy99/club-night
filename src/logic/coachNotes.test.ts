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
    // Ng5 hangs the knight; Bxf7+ is a bad capture (a bishop for a pawn), not a piece left for nothing.
    expect(gameErrorKinds(moves, evals, 'w')).toEqual(['undefended', 'lost-material'])
  })

  it('names the kind of mistake when it happens more than once', () => {
    // 3.Ng5?? and 4.Qh5?? (instead of 4.Bc4): two pieces left for nothing.
    const hung = parseLine('1. e4 e5 2. Nf3 Nc6 3. Ng5 Qxg5 4. Qh5 Qxh5 5. a3 Nf6 6. a4 Bc5 7. a5 d6 8. b3 Be6')
    const hungCps = [30, 30, 30, 30, 30, -300, -300, -1200, -1200, -1200, -1200, -1200, -1200, -1200, -1200, -1200, -1200]
    const hungBest: Record<number, string> = { 4: 'd2d4', 5: 'd8g5', 6: 'd2d3', 7: 'g5h5' }
    const hungEvals: PositionEval[] = hungCps.map((cp, i) => ({ cp, bestMove: hungBest[i] ?? null }))
    const notes = coachNotes({ moves: hung, evals: hungEvals, player: 'w', won: false })
    expect(notes).toContain('Twice you left a piece where it could be taken for nothing. Before every move: what’s defended?')
  })

  it('notices a habit across games first', () => {
    const notes = coachNotes({ moves, evals, player: 'w', won: false, recent: [['undefended'], ['undefended', 'fork']] })
    expect(notes[0]).toBe('That’s the third game in a row with a piece left undefended. It’s the one thing to fix this week.')
  })

  it('points out a win thrown away', () => {
    // The same game from Black's side, but Black didn't win it.
    const notes = coachNotes({ moves, evals, player: 'b', won: null })
    expect(notes[0]).toMatch(/^By move 3 you were well ahead on the board\. Being ahead still has to be turned into a win/)
  })

  it('stays quiet about games too short to say anything', () => {
    expect(coachNotes({ moves: moves.slice(0, 8), evals: evals.slice(0, 9), player: 'w', won: false })).toEqual([])
  })
})
