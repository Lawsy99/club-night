import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { findCharacter } from '../data/characters'
import { acceptsDraw, piecesLeft, shouldOfferDraw, shouldResign } from './opponentDecisions'

const clive = findCharacter('clive')
const toby = findCharacter('toby')
const oscar = findCharacter('oscar')
const marjorie = findCharacter('marjorie')
const dex = findCharacter('dex')

describe('resigning', () => {
  it('needs three hopeless moves in a row', () => {
    expect(shouldResign(dex, [-700, -800])).toBe(false)
    expect(shouldResign(dex, [-700, -800, -900])).toBe(true)
    expect(shouldResign(dex, [-700, -200, -900])).toBe(false)
  })

  it('Oscar resigns quickly; Marjorie plays on to mate', () => {
    expect(shouldResign(oscar, [-700])).toBe(true)
    expect(shouldResign(marjorie, [-2000, -3000, -9000])).toBe(false)
  })
})

describe('draws', () => {
  it('opponents accept only when clearly worse', () => {
    expect(acceptsDraw(dex, -200)).toBe(true)
    expect(acceptsDraw(dex, 0)).toBe(false)
  })

  it('Clive offers from move 12 when level, and not every move', () => {
    expect(shouldOfferDraw(clive, { evalCp: 10, moveNumber: 11, piecesLeft: 14 })).toBe(false)
    expect(shouldOfferDraw(clive, { evalCp: 10, moveNumber: 12, piecesLeft: 14 })).toBe(true)
    expect(shouldOfferDraw(clive, { evalCp: 200, moveNumber: 14, piecesLeft: 14 })).toBe(false)
    expect(shouldOfferDraw(clive, { evalCp: 0, moveNumber: 14, piecesLeft: 14, lastOfferMove: 12 })).toBe(false)
  })

  it('Toby offers when he is clearly worse', () => {
    expect(shouldOfferDraw(toby, { evalCp: -300, moveNumber: 20, piecesLeft: 10 })).toBe(true)
    expect(shouldOfferDraw(toby, { evalCp: 0, moveNumber: 20, piecesLeft: 10 })).toBe(false)
  })

  it('others offer only in dead-level endgames', () => {
    expect(shouldOfferDraw(dex, { evalCp: 0, moveNumber: 20, piecesLeft: 12 })).toBe(false)
    expect(shouldOfferDraw(dex, { evalCp: 0, moveNumber: 45, piecesLeft: 2 })).toBe(true)
  })

  it('counts the pieces left', () => {
    expect(piecesLeft(new Chess().fen())).toBe(14)
  })
})
