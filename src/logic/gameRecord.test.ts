import { describe, expect, it } from 'vitest'
import {
  newGameRecord,
  nextPlayerColour,
  outcomeOf,
  withMove,
  withResignation,
} from './gameRecord'

const play = (moves: string[]) =>
  moves.reduce(withMove, newGameRecord('w', 'casual'))

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

  it('report draws so they can be replayed', () => {
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8']
    expect(outcomeOf(play([...shuffle, ...shuffle]))?.winner).toBeNull()
  })
})

describe('colours', () => {
  it('start with White, then alternate every game', () => {
    expect(nextPlayerColour(null)).toBe('w')
    expect(nextPlayerColour(newGameRecord('w', 'casual'))).toBe('b')
    expect(nextPlayerColour(newGameRecord('b', 'casual'))).toBe('w')
  })
})
