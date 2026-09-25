// Style nudges (design document, "Styles"): among moves the engine already
// considers reasonable for the character's rating, moves that fit their style
// become 1.5 to 2 times likelier. Strength is untouched: the nudge only
// reorders choices a player of that rating would plausibly make.
import { Chess, type Move, type PieceSymbol } from 'chess.js'
import type { Style } from '../data/characters'
import { applyUci } from './game'
import { materialFor } from './material'

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** How much likelier a move becomes for this style (1 = no change). */
export function styleWeight(style: Style, fen: string, uci: string): number {
  const chess = new Chess(fen)
  const mover = chess.turn()
  const move = applyUci(chess, uci)
  if (!move) return 1
  switch (style) {
    case 'aggressive':
      return isCheck(move) || move.captured || nearEnemyKing(chess, move) ? 1.8 : 1
    case 'solid':
      return move.isKingsideCastle() || move.isQueensideCastle() || isDevelopment(move) ? 1.5 : 1
    case 'simplifying':
      return isTrade(move) ? 1.8 : 1
    case 'grinding':
      // Trade down when ahead, heading for a long endgame.
      return materialFor(fen, mover).lead > 0 && isTrade(move) ? 1.6 : 1
    case 'theoretical': // handled by the opening book
    case 'adaptive': // Toby's targeting arrives with the rival system (phase 6)
      return 1
  }
}

const isCheck = (move: Move) => move.san.includes('+') || move.san.includes('#')

/** A capture of something worth about as much as (or more than) the capturing piece. */
function isTrade(move: Move): boolean {
  return !!move.captured && VALUE[move.captured] >= VALUE[move.piece] - 1
}

/** A knight or bishop leaving its home rank. */
function isDevelopment(move: Move): boolean {
  const homeRank = move.color === 'w' ? '1' : '8'
  return (move.piece === 'n' || move.piece === 'b') && move.from[1] === homeRank && !move.captured
}

/** The moved piece lands within two squares of the enemy king. */
function nearEnemyKing(after: Chess, move: Move): boolean {
  const king = after.findPiece({ type: 'k', color: move.color === 'w' ? 'b' : 'w' })[0]
  if (!king) return false
  const dx = Math.abs(king.charCodeAt(0) - move.to.charCodeAt(0))
  const dy = Math.abs(Number(king[1]) - Number(move.to[1]))
  return Math.max(dx, dy) <= 2
}
