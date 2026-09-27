import { Chess } from 'chess.js'
import { afterEach, describe, expect, it } from 'vitest'
import { explainBestMove, explainMistake } from './explain'
import { replay } from './game'
import { lineText, moveHeading, moveName, setNotationStyle, styleForRating } from './notation'

const moveIn = (fen: string, san: string) => new Chess(fen).move(san)

afterEach(() => setNotationStyle('san'))

describe('notation style', () => {
  it('uses words below 1500 and notation from 1500', () => {
    expect(styleForRating(900)).toBe('words')
    expect(styleForRating(1499)).toBe('words')
    expect(styleForRating(1500)).toBe('san')
    expect(styleForRating(null)).toBe('words')
  })

  it('names moves in words', () => {
    setNotationStyle('words')
    const start = replay([]).fen()
    expect(moveName(moveIn(start, 'Nf3'))).toBe('the knight move to f3')
    expect(moveName(moveIn('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'Ra8+'))).toBe('the rook check on a8')
    expect(moveName(moveIn('4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1', 'Nxd5'))).toBe('the knight capture on d5')
    expect(moveName(moveIn('4k3/8/8/8/8/8/8/4K2R w K - 0 1', 'O-O'))).toBe('castling kingside')
  })

  it('writes lines and headings in words', () => {
    setNotationStyle('words')
    const chess = new Chess()
    const moves = ['e4', 'e5', 'Qh5'].map((san) => chess.move(san))
    expect(lineText(moves)).toBe('pawn to e4, pawn to e5, then queen to h5')
    expect(moveHeading(4, moves[2], '?')).toBe('Move 3: The queen move to h5 ?')
  })

  it('keeps notation for stronger players', () => {
    const chess = new Chess()
    const moves = ['e4', 'e5'].map((san) => chess.move(san))
    expect(lineText(moves)).toBe('e4 e5')
    expect(moveHeading(1, moves[1], '')).toBe('1… e5')
  })
})

describe('the coach in words', () => {
  it('starts sentences with the move in words', () => {
    setNotationStyle('words')
    const knightHangs = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f3g5']).fen()
    expect(explainBestMove(knightHangs, 'd8g5', 300)).toBe('The queen capture on g5 wins their knight: nothing can take it back.')
  })

  it('doesn’t say check twice', () => {
    setNotationStyle('words')
    const text = explainBestMove('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1a8', 0)
    expect(text.match(/check/g)).toHaveLength(1)
  })

  it('never leaves notation in a mistake explanation', () => {
    setNotationStyle('words')
    // Black ignores the threat to f7; the knight takes there with a fork.
    const fen = replay(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'f3g5']).fen()
    const text = explainMistake({
      fenBefore: fen,
      played: 'd8h4',
      bestMove: 'd7d5',
      reply: 'g5f7',
      cpBefore: 0,
      cpAfter: -400,
      replyLine: ['g5f7', 'h4f2', 'e1f2'],
    })
    expect(text).not.toMatch(/\b[NBRQK]x?[a-h][1-8]\b/)
  })
})
