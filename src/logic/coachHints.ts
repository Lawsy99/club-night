// The coach's hints (Joseph, Sep 2026): three per coached game, given as a
// nudge in words ("Is your king safe?", "Think about your knight"), never the
// move itself. Each nudge is chosen from what's actually on the board, in
// order of what matters most.
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { applyUci, type Colour } from './game'
import { moveIdeas } from './moveIdeas'

const NAMES: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
/** Engine scores beyond this mean a forced mate. */
const MATE = 9000

/**
 * A nudge towards `best` in the position `fen` (the player to move).
 * `cp` is the player's score with the best move, in centipawns.
 */
export function coachHint(fen: string, best: string, cp: number): string {
  const before = new Chess(fen)
  const me = before.turn()
  const them: Colour = me === 'w' ? 'b' : 'w'
  const after = new Chess(fen)
  const move = applyUci(after, best)
  if (!move) return 'Take your time. Checks, captures, threats.'

  if (after.isCheckmate()) return 'There’s a checkmate on the board. Find it.'
  if (cp >= MATE) return move.san.includes('+') ? 'You can force mate from here. Start with a check.' : 'There’s a forced win here. Look for it.'

  // Their threat comes first: a mate threat, or something of yours hanging.
  if (threatensMate(fen)) return 'Is your king safe? What are they threatening?'
  const from = best.slice(0, 2) as Square
  if (move.piece !== 'k' && move.piece !== 'p' && inTrouble(before, from, me, them)) {
    return `Your ${NAMES[move.piece]} is in trouble.`
  }

  if (move.captured) {
    const safe = after.attackers(move.to, them).length === 0
    if (safe) return 'Something of theirs isn’t defended.'
    if (VALUES[move.captured] > VALUES[move.piece]) return 'There’s a capture that wins material.'
  }
  const targets = attackedBy(after, move.to, them, me)
  if (targets.length >= 2 && targets.some((t) => t === 'k' || t === 'q' || t === 'r')) {
    return `Could your ${NAMES[move.piece]} attack two things at once?`
  }
  if (move.san.includes('+')) return 'Look at your checks.'
  if (move.isKingsideCastle() || move.isQueensideCastle()) return 'Your king would be happier tucked away.'
  // The idea behind the move, as a question rather than the answer.
  const ideas = moveIdeas(fen, best, cp)
  if (ideas.some((i) => i.startsWith('pins'))) return 'Can you pin one of their pieces?'
  if (ideas.includes('threatens mate')) return 'Is there a way to threaten mate?'
  if (ideas.some((i) => i.startsWith('defends'))) return 'What are they threatening? Deal with that first.'
  if (ideas.some((i) => i.includes('passed pawn'))) return 'Think about your passed pawn.'
  if (ideas.some((i) => i.includes('-file'))) return 'Is there an open file for a rook?'
  if (ideas.some((i) => i.startsWith('brings your king'))) return 'In an ending, the king is a fighting piece.'
  if (move.piece === 'p') return 'Think about your pawns.'
  return `Think about your ${NAMES[move.piece]}.`
}

/** Would the opponent have mate in one if it were their move? */
function threatensMate(fen: string): boolean {
  const parts = fen.split(' ')
  if (new Chess(fen).inCheck()) return false
  // The same position with the other side to move (and no en passant square).
  const swapped = [parts[0], parts[1] === 'w' ? 'b' : 'w', parts[2], '-', '0', '1'].join(' ')
  try {
    const chess = new Chess(swapped)
    return chess.moves({ verbose: true }).some((m) => {
      chess.move(m)
      const mate = chess.isCheckmate()
      chess.undo()
      return mate
    })
  } catch {
    return false
  }
}

/** Attacked and undefended, or attacked by something worth less. */
function inTrouble(chess: Chess, square: Square, me: Colour, them: Colour): boolean {
  const piece = chess.get(square)
  if (!piece) return false
  const attackers = chess.attackers(square, them)
  if (attackers.length === 0) return false
  if (chess.attackers(square, me).length === 0) return true
  return attackers.some((sq) => VALUES[chess.get(sq)!.type] < VALUES[piece.type])
}

/** Their pieces (not pawns) attacked by the piece on `from`. */
function attackedBy(chess: Chess, from: Square, victim: Colour, attacker: Colour): PieceSymbol[] {
  const hits: PieceSymbol[] = []
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.color === victim && cell.type !== 'p' && chess.attackers(cell.square, attacker).includes(from)) {
        hits.push(cell.type)
      }
    }
  }
  return hits
}
