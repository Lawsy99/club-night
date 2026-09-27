import { describe, expect, it } from 'vitest'
import { lastMeetingNote, scoutingReport } from './scouting'
import type { PositionEval } from './review'

const moves = Array.from({ length: 30 }, () => 'e2e4') // (only the count and scores matter here)
const evalsWith = (cpAfterYourMove: (ply: number) => number): PositionEval[] =>
  Array.from({ length: moves.length + 1 }, (_, i) => ({ cp: cpAfterYourMove(i), bestMove: null }))

describe('scouting reports remember last time', () => {
  it('a win you let slip', () => {
    const evals = evalsWith((i) => (i >= 12 && i < 20 ? 400 : 0))
    expect(lastMeetingNote({ moves, playerColour: 'w', won: false, evals }, 'her')).toBe(
      'Last time you were well ahead by move 7, and she still beat you. Finish the job this time.',
    )
  })

  it('a comeback', () => {
    const evals = evalsWith((i) => (i >= 8 && i < 16 ? -400 : 100))
    expect(lastMeetingNote({ moves, playerColour: 'w', won: true, evals }, 'him')).toBe(
      'Last time you were well behind by move 5 and came back. Don’t count on that twice.',
    )
  })

  it('just the result, without analysis', () => {
    expect(lastMeetingNote({ moves, playerColour: 'w', won: true }, 'him')).toBe('You beat him last time, in 15 moves. He’ll remember.')
  })

  it('goes into the report', () => {
    const report = scoutingReport({
      character: 'marjorie',
      playerColour: 'w',
      record: { wins: 0, losses: 1 },
      target: null,
      last: { moves, playerColour: 'w', won: false },
    })
    expect(report.at(-1)).toBe('She beat you last time, in 15 moves.')
  })
})
