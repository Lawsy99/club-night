import { describe, expect, it } from 'vitest'
import { isKeyMoment } from './keyMoment'

const cp = (value: number) => ({ type: 'cp' as const, value })
const line = (value: number, move = 'e2e4') => ({ score: cp(value), pv: [move] })

describe('key moments', () => {
  it('flags a position where one move is far better than the rest', () => {
    expect(isKeyMoment({ lines: [line(30), line(-250)], ply: 20, lastMove: null, earlier: [] })).toBe(true)
    expect(isKeyMoment({ lines: [line(400), line(20)], ply: 20, lastMove: null, earlier: [] })).toBe(true)
  })

  it('stays quiet when several moves are fine', () => {
    expect(isKeyMoment({ lines: [line(40), line(10)], ply: 20, lastMove: null, earlier: [] })).toBe(false)
  })

  it('stays quiet in the opening, for obvious recaptures, and when it’s all decided', () => {
    expect(isKeyMoment({ lines: [line(30), line(-250)], ply: 6, lastMove: null, earlier: [] })).toBe(false)
    const recapture = { uci: 'c6d4', captured: true }
    expect(isKeyMoment({ lines: [line(30, 'f3d4'), line(-300)], ply: 20, lastMove: recapture, earlier: [] })).toBe(false)
    expect(isKeyMoment({ lines: [line(1500), line(900)], ply: 20, lastMove: null, earlier: [] })).toBe(false)
  })

  it('is rare: two a game, well apart', () => {
    expect(isKeyMoment({ lines: [line(30), line(-250)], ply: 26, lastMove: null, earlier: [20] })).toBe(false)
    expect(isKeyMoment({ lines: [line(30), line(-250)], ply: 40, lastMove: null, earlier: [14, 28] })).toBe(false)
    expect(isKeyMoment({ lines: [line(30), line(-250)], ply: 40, lastMove: null, earlier: [20] })).toBe(true)
  })
})
