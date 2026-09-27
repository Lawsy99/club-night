import { describe, expect, it } from 'vitest'
import { STUDY_HABITS, STUDY_PHASES, STUDY_TEXT } from '../data/prepStudy'
import type { ErrorKind } from './explain'
import { prepStudy } from './prepStudy'
import type { ReviewedMove } from './review'
import type { StatsGame } from './stats'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const ENDGAME = '8/5k2/8/3r4/8/2R5/5K2/8 w - - 0 40'
const ITALIAN = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']

const move = (ply: number, accuracy: number, fenBefore = START): ReviewedMove => ({
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
})

const game = (over: Partial<StatsGame>): StatsGame => ({
  finishedAt: 1,
  character: 'marjorie',
  playerColour: 'w',
  result: 'loss',
  sans: ITALIAN,
  ...over,
})

describe('Pemberton’s study of you', () => {
  it('says there is little to go on for a new player, without guessing', () => {
    const [openings, habits, phases, night] = prepStudy([], [])
    expect(openings.lines).toEqual([STUDY_TEXT.noOpenings])
    expect(habits.lines).toEqual([STUDY_TEXT.noReviews])
    expect(phases.lines).toEqual([STUDY_TEXT.noPhases])
    expect(night.lines).toEqual([STUDY_TEXT.onTheNight])
  })

  it('names the opening you play most, and how you score in it', () => {
    const games = [game({}), game({}), game({ result: 'win' }), game({})]
    expect(prepStudy(games, [])[0].lines[0]).toBe(STUDY_TEXT.weakOpening('White', 'the Italian', 4, 25))
    const winning = games.map((g) => ({ ...g, result: 'win' as const }))
    expect(prepStudy(winning, [])[0].lines[0]).toContain('Get them out of it early')
  })

  it('names the habit that turns up in the most games, preferring a concrete one', () => {
    const kinds: ErrorKind[][] = [['fork', 'positional'], ['positional', 'fork'], ['positional'], ['undefended']]
    expect(prepStudy([], kinds)[1].lines).toEqual([STUDY_HABITS.fork, STUDY_TEXT.habitSeen(2, 4)])
    expect(prepStudy([], [['undefended'], ['fork'], []])[1].lines).toEqual([STUDY_TEXT.noHabit])
  })

  it('finds the weakest part of the game', () => {
    const opening = Array.from({ length: 12 }, (_, i) => move(i * 2, 90))
    const ending = Array.from({ length: 12 }, (_, i) => move(40 + i * 2, 60, ENDGAME))
    expect(prepStudy([game({ reviewed: [...opening, ...ending] })], [])[2].lines).toEqual([STUDY_PHASES.endgame])
  })
})
