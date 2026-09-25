import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import {
  applyUci,
  checkedKingSquare,
  formatLine,
  getOutcome,
  isPromotion,
  legalTargets,
  replay,
} from './game'

describe('en passant', () => {
  it('can be played straight after the two-square pawn move', () => {
    // 1.e4 a6 2.e5 d5 3.exd6 e.p.
    const chess = replay(['e2e4', 'a7a6', 'e4e5', 'd7d5'])
    expect(legalTargets(chess, 'e5')).toContain('d6')
    const move = applyUci(chess, 'e5d6')
    expect(move?.isEnPassant()).toBe(true)
    // The captured black pawn on d5 has gone.
    expect(chess.get('d5')).toBeUndefined()
    expect(chess.get('d6')).toEqual({ type: 'p', color: 'w' })
  })

  it('is no longer allowed one move later', () => {
    const chess = replay(['e2e4', 'a7a6', 'e4e5', 'd7d5', 'h2h3', 'h7h6'])
    expect(legalTargets(chess, 'e5')).not.toContain('d6')
    expect(applyUci(chess, 'e5d6')).toBeNull()
  })
})

describe('promotion', () => {
  const fen = '8/P6k/8/8/8/8/8/K7 w - - 0 1'

  it('is detected so the app can ask which piece', () => {
    const chess = new Chess(fen)
    expect(isPromotion(chess, 'a7', 'a8')).toBe(true)
    expect(isPromotion(chess, 'a1', 'a2')).toBe(false)
  })

  it('allows promoting to a knight', () => {
    const chess = new Chess(fen)
    applyUci(chess, 'a7a8n')
    expect(chess.get('a8')).toEqual({ type: 'n', color: 'w' })
  })
})

describe('castling', () => {
  it('is legal once the squares are clear', () => {
    const chess = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5'])
    expect(applyUci(chess, 'e1g1')?.isKingsideCastle()).toBe(true)
    expect(chess.get('f1')).toEqual({ type: 'r', color: 'w' })
  })
})

describe('illegal moves', () => {
  it('are refused without crashing', () => {
    const chess = new Chess()
    expect(applyUci(chess, 'e2e5')).toBeNull()
    expect(() => replay(['e2e4', 'e2e4'])).toThrow()
  })
})

describe('formatLine', () => {
  it('writes an engine line in normal notation', () => {
    expect(formatLine(new Chess().fen(), ['e2e4', 'e7e5', 'g1f3'])).toBe('1. e4 e5 2. Nf3')
  })

  it('starts with an ellipsis when Black is to move', () => {
    expect(formatLine(replay(['e2e4']).fen(), ['c7c5', 'g1f3'])).toBe('1… c5 2. Nf3')
  })

  it('stops at an impossible move rather than crashing', () => {
    expect(formatLine(new Chess().fen(), ['e2e4', 'e2e4'])).toBe('1. e4')
  })
})

describe('game endings', () => {
  it('spots checkmate and names the winner', () => {
    // Fool's mate.
    const chess = replay(['f2f3', 'e7e5', 'g2g4', 'd8h4'])
    expect(getOutcome(chess)).toEqual({ winner: 'b', reason: 'checkmate' })
    expect(checkedKingSquare(chess)).toBe('e1')
  })

  it('spots stalemate', () => {
    const chess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
    expect(getOutcome(chess)).toEqual({ winner: null, reason: 'stalemate' })
  })

  it('spots threefold repetition', () => {
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8']
    const chess = replay([...shuffle, ...shuffle])
    expect(getOutcome(chess)).toEqual({ winner: null, reason: 'threefold' })
  })

  it('spots insufficient material', () => {
    const chess = new Chess('8/8/8/4k3/8/8/8/4K3 w - - 0 1')
    expect(getOutcome(chess)).toEqual({ winner: null, reason: 'insufficient' })
  })

  it('says nothing while the game is going', () => {
    expect(getOutcome(replay(['e2e4']))).toBeNull()
  })
})
