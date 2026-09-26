import { describe, expect, it } from 'vitest'
import type { ReviewedMove } from './review'
import { accuracyByPhase, accuracyTrend, openingScores, phaseOf, recordByCharacter, type StatsGame } from './stats'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const ENDGAME = '8/5k2/8/3r4/8/2R5/5K2/8 w - - 0 40'

function move(ply: number, accuracy: number, fenBefore = START): ReviewedMove {
  return {
    ply,
    mover: ply % 2 === 0 ? 'w' : 'b',
    uci: 'e2e4',
    san: 'e4',
    fenBefore,
    winBefore: 0.5,
    winAfter: 0.5,
    rating: 'good',
    bestMove: null,
    accuracy,
  }
}

const game = (over: Partial<StatsGame>): StatsGame => ({
  finishedAt: 1,
  character: 'marjorie',
  playerColour: 'w',
  result: 'win',
  sans: ['e4', 'e6'],
  ...over,
})

describe('stats', () => {
  it('counts the record against each character, skipping ones never played', () => {
    const games = [game({}), game({ result: 'loss' }), game({ character: 'dex', result: 'draw' }), game({ character: null })]
    expect(recordByCharacter(games, ['marjorie', 'dex', 'toby'])).toEqual([
      { id: 'marjorie', record: { wins: 1, losses: 1, draws: 0 } },
      { id: 'dex', record: { wins: 0, losses: 0, draws: 1 } },
    ])
  })

  it('lists accuracy for reviewed games only, oldest first', () => {
    const reviewed = [move(0, 90), move(2, 80)]
    const trend = accuracyTrend([game({ finishedAt: 5, reviewed }), game({ finishedAt: 2 }), game({ finishedAt: 1, reviewed })])
    expect(trend.map((t) => t.at)).toEqual([1, 5])
  })

  it('splits accuracy by phase, from the player’s moves only', () => {
    expect(phaseOf(move(4, 100))).toBe('opening')
    expect(phaseOf(move(30, 100))).toBe('middlegame')
    expect(phaseOf(move(60, 100, ENDGAME))).toBe('endgame')

    const opening = Array.from({ length: 10 }, (_, i) => move(i * 2, 90))
    const theirs = Array.from({ length: 10 }, (_, i) => move(i * 2 + 1, 10)) // Black's: ignored
    const byPhase = accuracyByPhase([game({ reviewed: [...opening, ...theirs] })])
    expect(byPhase).toEqual({ opening: 90, middlegame: null, endgame: null })
  })

  it('ranks openings by score, needing at least two games', () => {
    const french = ['e4', 'e6']
    const sicilian = ['e4', 'c5']
    const scores = openingScores([
      game({ sans: french }),
      game({ sans: french, result: 'draw' }),
      game({ sans: sicilian, result: 'loss' }),
      game({ sans: sicilian, result: 'loss' }),
      game({ sans: ['d4', 'd5', 'c4', 'e6'] }), // only one game: left out
    ])
    expect(scores).toEqual([
      { opening: 'french', colour: 'w', played: 2, score: 0.75 },
      { opening: 'sicilian', colour: 'w', played: 2, score: 0 },
    ])
  })
})
