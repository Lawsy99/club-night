import { describe, expect, it } from 'vitest'
import { isKeyMoment } from './keyMoment'

const cp = (value: number) => ({ type: 'cp' as const, value })
const lines = (...values: number[]) => values.map((value, i) => ({ score: cp(value), pv: [i === 0 ? 'e2e4' : 'a2a3'] }))
const at = (l: ReturnType<typeof lines>, legalMoves = 30) => ({ lines: l, legalMoves, ply: 20, lastMove: null, earlier: [] })

describe('key moments', () => {
  it('flags the only move that holds, or the one move that wins', () => {
    expect(isKeyMoment(at(lines(30, -250, -300, -400)))).toBe(true)
    expect(isKeyMoment(at(lines(400, 20, 0, -50)))).toBe(true)
  })

  it('flags a narrow position: a few good moves, and most of the rest blunders', () => {
    // Three moves hold; the fourth already loses a piece's worth.
    expect(isKeyMoment(at(lines(20, 10, 0, -300, -350, -400, -500, -600)))).toBe(true)
  })

  it('stays quiet when plenty of moves are fine', () => {
    expect(isKeyMoment(at(lines(40, 30, 25, 20, 10, 0, -10, -20)))).toBe(false)
    // Four good moves: not narrow enough.
    expect(isKeyMoment(at(lines(20, 15, 10, 5, -300, -400)))).toBe(false)
  })

  it('stays quiet when only a few moves are bad', () => {
    // Two good moves and a blunder, but only six legal moves: most don't lose.
    expect(isKeyMoment(at(lines(20, 10, 0, -50, -80, -300), 6))).toBe(false)
  })

  it('stays quiet in the opening, for obvious recaptures, and when it’s all decided', () => {
    expect(isKeyMoment({ ...at(lines(30, -250)), ply: 6 })).toBe(false)
    const recapture = { uci: 'c6e4', captured: true }
    expect(isKeyMoment({ ...at(lines(30, -250)), lastMove: recapture })).toBe(false)
    expect(isKeyMoment(at(lines(1500, 900)))).toBe(false)
  })

  it('is rare: two a game, well apart', () => {
    expect(isKeyMoment({ ...at(lines(30, -250)), ply: 26, earlier: [20] })).toBe(false)
    expect(isKeyMoment({ ...at(lines(30, -250)), ply: 40, earlier: [14, 28] })).toBe(false)
    expect(isKeyMoment({ ...at(lines(30, -250)), ply: 40, earlier: [20] })).toBe(true)
  })
})
