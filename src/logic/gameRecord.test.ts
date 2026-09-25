import { describe, expect, it } from 'vitest'
import type { HelpStageId } from '../data/helpStages'
import type { Colour } from './game'
import {
  canTakeBack,
  newGameRecord,
  nextPlayerColour,
  outcomeOf,
  takebacksLeft,
  withDrawAgreed,
  withMove,
  withOpponentEval,
  withResignation,
  withTakeback,
} from './gameRecord'

const play = (moves: string[], colour: Colour = 'w', stage: HelpStageId = 'assisted') =>
  moves.reduce(withMove, newGameRecord(colour, 'casual', stage))

describe('game records', () => {
  it('store legal moves and ignore illegal ones', () => {
    const game = play(['e2e4', 'e7e5', 'e2e4'])
    expect(game.moves).toEqual(['e2e4', 'e7e5'])
  })

  it('refuse moves once the game is over', () => {
    const mated = play(['f2f3', 'e7e5', 'g2g4', 'd8h4'])
    expect(withMove(mated, 'a2a3')).toBe(mated)
  })

  it('record a resignation as a win for the other side', () => {
    const game = withResignation(play(['e2e4']), 'w')
    expect(outcomeOf(game)).toEqual({ winner: 'b', reason: 'resignation' })
    expect(withMove(game, 'e7e5').moves).toEqual(['e2e4'])
  })

  it('record an agreed draw, which is replayed like any draw', () => {
    const game = withDrawAgreed(play(['e2e4', 'e7e5']))
    expect(outcomeOf(game)).toEqual({ winner: null, reason: 'agreement' })
    expect(withMove(game, 'g1f3').moves).toHaveLength(2)
  })

  it('keep only the last few opponent evaluations', () => {
    let game = play([])
    for (const cp of [1, 2, 3, 4, 5, 6, 7]) game = withOpponentEval(game, cp)
    expect(game.opponentEvals).toEqual([3, 4, 5, 6, 7])
  })

  it('report draws so they can be replayed', () => {
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8']
    expect(outcomeOf(play([...shuffle, ...shuffle]))?.winner).toBeNull()
  })
})

describe('takebacks', () => {
  it("undo the player's move and the reply, back to the player's turn", () => {
    const game = withTakeback(play(['e2e4', 'e7e5', 'g1f3', 'b8c6']))
    expect(game.moves).toEqual(['e2e4', 'e7e5'])
    expect(game.takebacksUsed).toBe(1)
  })

  it('undo just the player’s move if the opponent has not replied yet', () => {
    expect(withTakeback(play(['e2e4', 'e7e5', 'g1f3'])).moves).toEqual(['e2e4', 'e7e5'])
  })

  it('work when playing Black', () => {
    const game = withTakeback(play(['e2e4', 'e7e5', 'g1f3'], 'b'))
    expect(game.moves).toEqual(['e2e4'])
  })

  it('need a move of the player’s to undo', () => {
    expect(canTakeBack(play(['e2e4'], 'b'))).toBe(false)
  })

  it('are limited to 3 in guided and none in real', () => {
    let guided = play(['e2e4', 'e7e5'], 'w', 'guided')
    for (let i = 0; i < 3; i++) guided = withTakeback(withMove(withMove(guided, 'g1f3'), 'b8c6'))
    expect(takebacksLeft(guided)).toBe(0)
    expect(canTakeBack(withMove(guided, 'g1f3'))).toBe(false)
    expect(canTakeBack(play(['e2e4', 'e7e5'], 'w', 'real'))).toBe(false)
  })

  it('are unlimited in assisted', () => {
    expect(takebacksLeft(play(['e2e4']))).toBe(Infinity)
  })

  it('are not allowed once the game is over', () => {
    expect(canTakeBack(play(['f2f3', 'e7e5', 'g2g4', 'd8h4']))).toBe(false)
  })
})

describe('colours', () => {
  it('start with White, then alternate every game', () => {
    expect(nextPlayerColour(null)).toBe('w')
    expect(nextPlayerColour(newGameRecord('w', 'casual', 'real'))).toBe('b')
    expect(nextPlayerColour(newGameRecord('b', 'casual', 'real'))).toBe('w')
  })
})
