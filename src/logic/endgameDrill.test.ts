import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { ENDGAME_DRILLS, endgameFor } from '../data/endgameDrills'
import { LESSONS } from '../data/lessons'
import { OPENING_DRILLS } from '../data/openingLessons'
import { judgeEndgame } from './endgameDrill'

describe('finishing drills', () => {
  it('are legal positions, with the side to win on move and something to win with', () => {
    for (const [group, list] of Object.entries(ENDGAME_DRILLS)) {
      for (const p of list) {
        const chess = new Chess(p.fen)
        expect(chess.isGameOver(), `${group}/${p.id}`).toBe(false)
        expect(judgeEndgame(p, p.fen, chess.turn(), 0), `${group}/${p.id}`).toBe('going')
      }
    }
  })

  it('are chosen by rating', () => {
    expect(endgameFor('lone-king', 600)?.id).toBe('two-rooks')
    expect(endgameFor('lone-king', 1200)?.id).toBe('queen')
    expect(endgameFor('lone-king', 2200)?.id).toBe('rook')
    expect(endgameFor('rook-ending', 1800)?.id).toBe('lucena')
  })

  it('know a win, a stalemate and a promotion that survived', () => {
    const q = ENDGAME_DRILLS['lone-king'][1]
    expect(judgeEndgame(q, '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'w', 5)).toBe('stalemate')
    expect(judgeEndgame(q, '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1', 'w', 5)).toBe('won')
    const kp = ENDGAME_DRILLS['king-pawn'][0]
    expect(judgeEndgame(kp, '4Q3/8/3K1k2/8/8/8/8/8 w - - 0 1', 'w', 6)).toBe('won')
    expect(judgeEndgame(kp, '8/8/3K1k2/8/8/8/8/8 w - - 0 1', 'w', 6)).toBe('drawn')
  })

  it('every lesson drill exists', () => {
    for (const l of LESSONS.filter((l) => l.drill)) {
      const exists = l.kind === 'opening' ? !!OPENING_DRILLS[l.drill!] : !!ENDGAME_DRILLS[l.drill!]
      expect(exists, l.id).toBe(true)
    }
  })
})
