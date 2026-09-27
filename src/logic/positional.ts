// Positional harm (Joseph, Sep 2026: the coach should explain ideas, not
// only tactics). When a move lost ground without anything being taken, these
// checks find the reason club players actually lose games to: a weakened
// king, bad pawns, the bishop pair given away, trading when behind, the queen
// out too early, castling rights thrown away, pieces moved twice. Each is a
// plain fact about the move and the board.
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { applyUci, type Colour } from './game'

export type PositionalKind =
  | 'king-weakened'
  | 'doubled-pawns'
  | 'isolated-pawn'
  | 'bishop-pair'
  | 'traded-behind'
  | 'early-queen'
  | 'lost-castling'
  | 'same-piece-twice'

const FILES = 'abcdefgh'
const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

/** What a move did to the position, if it did something a coach would name. */
export function positionalHarm(fenBefore: string, uci: string, cpBefore = 0): { kind: PositionalKind; text: string } | null {
  const before = new Chess(fenBefore)
  const me = before.turn() as Colour
  const after = new Chess(fenBefore)
  const move = applyUci(after, uci) as Move | null
  if (!move) return null
  const moveNo = Number(fenBefore.split(' ')[5] ?? 1)

  // The king: castling rights given up by walking.
  if (move.piece === 'k' && !move.isKingsideCastle() && !move.isQueensideCastle()) {
    const rights = fenBefore.split(' ')[2]
    const mine = me === 'w' ? /[KQ]/ : /[kq]/
    if (mine.test(rights)) return { kind: 'lost-castling', text: 'That king move cost you the right to castle. Your king will be stuck in the middle.' }
  }

  // A pawn pushed in front of your own castled king.
  if (move.piece === 'p' && !move.captured) {
    const king = before.findPiece({ type: 'k', color: me })[0]
    const homeRank = me === 'w' ? '1' : '8'
    if (king && king[1] === homeRank && 'abgh'.includes(king[0])) {
      const kf = FILES.indexOf(king[0])
      const pf = FILES.indexOf(move.from[0])
      if (Math.abs(kf - pf) <= 1) {
        return {
          kind: 'king-weakened',
          text: 'That pushed a pawn in front of your castled king. The squares it leaves behind are holes their pieces can use.',
        }
      }
    }
  }

  // The queen out early, before the smaller pieces.
  if (move.piece === 'q' && !move.captured && moveNo <= 8 && homeMinors(before, me) >= 2) {
    return { kind: 'early-queen', text: 'The queen came out early. She’ll be chased about while their pieces develop with tempo.' }
  }

  // The same piece again, with others still at home.
  if ((move.piece === 'n' || move.piece === 'b') && moveNo <= 10 && !move.captured) {
    const homeRank = me === 'w' ? '1' : '8'
    if (move.from[1] !== homeRank && homeMinors(before, me) >= 2) {
      return { kind: 'same-piece-twice', text: 'That’s the same piece moving again while others are still at home. Get everything out first.' }
    }
  }

  // Swapping pieces while behind.
  if (move.captured && move.piece !== 'p' && Math.abs(VALUES[move.captured] - VALUES[move.piece]) <= 1 && cpBefore <= -200) {
    return { kind: 'traded-behind', text: 'You swapped pieces while behind. With less material, keep pieces on and look for chances.' }
  }

  // The bishop given up for a knight, when you had the pair and they didn't.
  if (move.piece === 'b' && move.captured === 'n' && bishops(before, me) === 2 && bishops(before, me === 'w' ? 'b' : 'w') < 2) {
    return { kind: 'bishop-pair', text: 'You gave up a bishop for a knight. Two bishops together are worth more than they look.' }
  }

  // Pawn structure: a pawn capture that doubles or isolates your pawns.
  if (move.piece === 'p' && move.captured) {
    const doubledBefore = doubledFiles(before, me)
    const doubledAfter = doubledFiles(after, me)
    const newDoubled = doubledAfter.find((f) => !doubledBefore.includes(f))
    if (newDoubled) return { kind: 'doubled-pawns', text: `That left you with doubled pawns on the ${newDoubled}-file. They can’t protect each other.` }
    const isolatedBefore = isolatedFiles(before, me)
    const newIsolated = isolatedFiles(after, me).find((f) => !isolatedBefore.includes(f))
    if (newIsolated) {
      return { kind: 'isolated-pawn', text: `That left your ${newIsolated}-pawn isolated: no pawn beside it can ever defend it.` }
    }
  }
  return null
}

function homeMinors(chess: Chess, side: Colour): number {
  const rank = side === 'w' ? '1' : '8'
  const homes = ['b', 'c', 'f', 'g'].map((f) => `${f}${rank}` as Square)
  return homes.filter((sq) => {
    const p = chess.get(sq)
    return p && p.color === side && (p.type === 'n' || p.type === 'b')
  }).length
}

function bishops(chess: Chess, side: Colour): number {
  return chess.findPiece({ type: 'b', color: side }).length
}

function pawnFiles(chess: Chess, side: Colour): Map<string, number> {
  const files = new Map<string, number>()
  for (const sq of chess.findPiece({ type: 'p', color: side })) files.set(sq[0], (files.get(sq[0]) ?? 0) + 1)
  return files
}

function doubledFiles(chess: Chess, side: Colour): string[] {
  return [...pawnFiles(chess, side).entries()].filter(([, n]) => n >= 2).map(([f]) => f)
}

function isolatedFiles(chess: Chess, side: Colour): string[] {
  const files = pawnFiles(chess, side)
  return [...files.keys()].filter((f) => {
    const i = FILES.indexOf(f)
    return !files.has(FILES[i - 1]) && !files.has(FILES[i + 1])
  })
}
