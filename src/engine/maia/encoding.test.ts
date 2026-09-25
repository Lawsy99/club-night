import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { replay } from '../../logic/game'
import {
  boardTokens,
  decodePolicy,
  decodeValue,
  encodePosition,
  mirrorFen,
  mirrorMove,
  MOVE_VOCABULARY,
} from './encoding'

describe('Maia encoding', () => {
  it('has the full move vocabulary', () => {
    expect(MOVE_VOCABULARY).toBe(4352)
  })

  it('mirrors positions and moves', () => {
    const afterE4 = replay(['e2e4']).fen()
    // Black to move after 1.e4 looks like White to move after 1...e5 flipped.
    expect(mirrorFen(afterE4)).toBe('rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(mirrorMove('e7e5')).toBe('e2e4')
    expect(mirrorMove('a2a1q')).toBe('a7a8q')
  })

  it('places pieces on the right squares', () => {
    const tokens = boardTokens(new Chess().fen())
    const at = (square: number, piece: number) => tokens[square * 12 + piece]
    expect(at(0, 3)).toBe(1) // a1: white rook
    expect(at(4, 5)).toBe(1) // e1: white king
    expect(at(60, 11)).toBe(1) // e8: black king
    expect(tokens.reduce((a, b) => a + b, 0)).toBe(32)
  })

  it('lists every legal move, for either side', () => {
    expect(encodePosition(new Chess().fen()).legalIndices).toHaveLength(20)
    expect(encodePosition(replay(['e2e4']).fen()).legalIndices).toHaveLength(20)
  })

  it('turns scores back into real moves, flipping for Black', () => {
    const fen = replay(['e2e4']).fen()
    const input = encodePosition(fen)
    // Every decoded move must be legal on the real board (Black to move).
    const legal = new Chess(fen).moves({ verbose: true }).map((m) => m.from + m.to)
    const uniform = decodePolicy(new Float32Array(MOVE_VOCABULARY), input)
    expect(uniform.map((m) => m.move).sort()).toEqual(legal.sort())
    expect(uniform.reduce((a, m) => a + m.p, 0)).toBeCloseTo(1)
    // A strong score on one move makes it the favourite.
    const favourite = input.legalIndices[3]
    const logits = new Float32Array(MOVE_VOCABULARY)
    logits[favourite] = 10
    expect(decodePolicy(logits, input)[0].p).toBeGreaterThan(0.99)
  })

  it('reads the win chance', () => {
    expect(decodeValue(Float32Array.from([0, 0, 0]))).toBeCloseTo(0.5)
    expect(decodeValue(Float32Array.from([-5, -5, 5]))).toBeGreaterThan(0.99)
  })
})

