// The coach's hints (Joseph, Sep 2026): three per coached game, given as a
// nudge in words ("Is your king safe?", "Think about your knight"), never the
// move itself. Each nudge is chosen from what's actually on the board, in
// order of what matters most.
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { applyUci, type Colour } from './game'
import { findTactic, followLine } from './lineFacts'
import { moveIdeas } from './moveIdeas'

const NAMES: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
/** Engine scores beyond this mean a forced mate. */
const MATE = 9000

/**
 * A nudge towards `best` in the position `fen` (the player to move).
 * `cp` is the player's score with the best move, in centipawns.
 */
export function coachHint(fen: string, best: string, cp: number, line?: readonly string[]): string {
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

  // With the engine's line: nudge towards the tactic it proves (Sep 2026:
  // only point at a fork if a forked piece really falls).
  const out = followLine(fen, line?.[0] === best ? line : [best])
  // (Only if the engine's score backs the win up; see explain.ts.)
  if (out.net >= 1 && out.net * 100 <= cp + 400) {
    const found = findTactic(out)
    if (found?.index === 0) {
      switch (found.tactic.kind) {
        case 'undefended':
          return 'Something of theirs isn’t defended.'
        case 'fork':
          return `Could your ${NAMES[move.piece]} attack two things at once?`
        case 'pin':
          return 'Can you pin one of their pieces?'
        case 'skewer':
          return 'Look along the lines through their king and queen.'
        case 'discovered':
          return 'What happens if one of your pieces gets out of the way of another?'
        case 'defender':
          return 'Which of their pieces is doing an important job? Can you take it?'
      }
    }
    if (move.captured || move.san.includes('+')) return 'There’s a way to win material. Start with a forcing move.'
    return 'There’s material to be won, but it takes a quiet move first.'
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

