import { describe, expect, it } from 'vitest'
import { rivalTarget, worstOpening, type PlayedGame } from './rival'
import { scoutingReport } from './scouting'

const french = ['e4', 'e6', 'd4', 'd5']
const italian = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4']
const g = (sans: string[], won: boolean, playerColour: 'w' | 'b' = 'w', rated = true): PlayedGame => ({
  sans,
  playerColour,
  won,
  rated,
})

describe('rival targeting', () => {
  it('finds the opening where the player scores worst', () => {
    const games = [g(french, false), g(french, false), g(french, true), g(italian, true), g(italian, true)]
    expect(worstOpening(games)).toMatchObject({ opening: 'french', colour: 'w', games: 3 })
  })

  it('keeps colours separate', () => {
    const games = [g(french, true, 'w'), g(french, true, 'w'), g(french, false, 'b'), g(french, false, 'b')]
    expect(worstOpening(games)).toMatchObject({ opening: 'french', colour: 'b' })
  })

  it('waits for 10 real games before targeting', () => {
    const nine = Array.from({ length: 9 }, () => g(french, false))
    expect(rivalTarget(nine)).toBeNull()
    expect(rivalTarget([...nine, g(french, false)])).toMatchObject({ opening: 'french' })
  })

  it("names the target in Coach Pemberton's report on Toby", () => {
    const report = scoutingReport({
      character: 'toby',
      playerColour: 'w',
      record: { wins: 1, losses: 3 },
      target: { opening: 'sicilian', colour: 'w', score: 0.2, games: 5 },
    })
    expect(report[0]).toMatch(/Najdorf/) // he has Black: his Black openings
    expect(report[2]).toBe('Your record against him: 1 won, 3 lost.')
    expect(report[3]).toMatch(/the Sicilian as White/)
  })

  it('only targets a real weakness', () => {
    const winning = Array.from({ length: 10 }, () => g(french, true))
    expect(rivalTarget(winning)).toBeNull()
  })
})
