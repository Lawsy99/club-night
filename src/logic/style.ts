// Style nudges (design document, "Styles"): among moves the engine already
// considers reasonable for the character's rating, moves that fit their style
// become 1.5 to 2 times likelier. Strength is untouched: the nudge only
// reorders choices a player of that rating would plausibly make.
//
// Sep 2026: personal traits on top of the style, so two "solid" players
// don't play alike: Marjorie and Clive swap queens whenever they can, Dex
// throws his kingside pawns forward, Terry walks his king, Graham likes
// classical centre pawns.
import { Chess, type Move, type PieceSymbol } from 'chess.js'
import type { Style, Trait } from '../data/characters'
import { applyUci } from './game'
import { materialFor } from './material'

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** How much likelier a move becomes for this style and these traits (1 = no change). */
export function styleWeight(style: Style, fen: string, uci: string, traits: readonly Trait[] = []): number {
  const chess = new Chess(fen)
  const mover = chess.turn()
  const move = applyUci(chess, uci)
  if (!move) return 1
  let weight = 1
  switch (style) {
    case 'aggressive':
      weight = isCheck(move) || move.captured || nearEnemyKing(chess, move) ? 1.8 : 1
      break
    case 'solid':
      weight = move.isKingsideCastle() || move.isQueensideCastle() || isDevelopment(move) ? 1.5 : 1
      break
    case 'simplifying':
      weight = isTrade(move) ? 1.8 : 1
      break
    case 'grinding':
      // Trade down when ahead, heading for a long endgame.
      weight = materialFor(fen, mover).lead > 0 && isTrade(move) ? 1.6 : 1
      break
    case 'theoretical': // handled by the opening book
    case 'adaptive': // Toby's targeting: see the rival system
      weight = 1
  }
  for (const trait of traits) weight *= traitWeight(trait, fen, move)
  return weight
}

function traitWeight(trait: Trait, fen: string, move: Move): number {
  switch (trait) {
    case 'queen-trader':
      // Takes the queen off whenever it's an even swap.
      return move.captured === 'q' && move.piece === 'q' ? 2.5 : 1
    case 'pawn-storm': {
      // Pushes the pawns in front of the enemy king (g- and h-pawns, usually).
      if (move.piece !== 'p') return 1
      const king = new Chess(fen).findPiece({ type: 'k', color: move.color === 'w' ? 'b' : 'w' })[0]
      if (!king) return 1
      const fileGap = Math.abs(king.charCodeAt(0) - move.to.charCodeAt(0))
      return fileGap <= 1 && !move.captured ? 1.6 : 1
    }
    case 'king-walker':
      // Terry: the king steps forward whenever that's not actually losing.
      return move.piece === 'k' && !move.isKingsideCastle() && !move.isQueensideCastle() ? 1.8 : 1
    case 'centre-pawns':
      return move.piece === 'p' && ['c', 'd', 'e'].includes(move.to[0]) && !move.captured ? 1.4 : 1
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
