// Which dialogue triggers the opponent's latest move sets off (design
// document, "Triggers"). The player's move quality comes from the move rating.
//
// Sep 2026 (Joseph: characters should come through how they react to the
// game): as well as blunders, captures and checks, the moments each
// character cares about. Marjorie and Clive notice the queens coming off,
// Priya notices leaving her book, Dex his sacrifices, Terry his king going
// for a walk. All are plain facts about the board.
import { Chess, type Move, type Square } from 'chess.js'
import type { Trigger } from './dialogue'
import type { MoveRating } from './moveRating'
import { piecesLeft } from './opponentDecisions'

export type TriggerInputs = {
  /** The opponent's move just played. */
  botMove: Move
  /** The player's previous move, rated (null if not yet known). */
  playerRating: MoveRating | null
  /** The opponent's evaluation of the position, before this move (centipawns, its view). */
  botEvalCp: number | null
  /** The position before the opponent's move (for the character moments). */
  fenBefore?: string
  /** This move ended the opponent's opening book (the one before was from it). */
  leftBook?: boolean
}

const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

export function triggersFor({ botMove, playerRating, botEvalCp, fenBefore, leftBook }: TriggerInputs): Trigger[] {
  const t: Trigger[] = []
  if (playerRating === 'blunder') t.push('player_blunder')
  if (playerRating === 'best') t.push('strong_move')
  if (botMove.captured === 'q') t.push('capture_queen')
  else if (botMove.captured === 'r') t.push('capture_rook')
  else if (botMove.captured === 'n' || botMove.captured === 'b') t.push('capture_minor')
  if (botMove.san.includes('+')) t.push('check_given')
  if (botMove.isKingsideCastle() || botMove.isQueensideCastle()) t.push('castling')
  if (botMove.isEnPassant()) t.push('en_passant')
  if (botMove.isPromotion()) t.push('promotion')
  if (botEvalCp !== null && botEvalCp >= 300) t.push('clearly_winning')
  if (botEvalCp !== null && botEvalCp <= -300) t.push('clearly_losing')

  // The character moments.
  if (leftBook) t.push('out_of_book')
  if (fenBefore) {
    const before = fenBefore.split(' ')[0]
    const after = botMove.after.split(' ')[0]
    const queens = (board: string) => [...board].filter((c) => c === 'q' || c === 'Q').length
    if (queens(before) > 0 && queens(after) === 0) t.push('queens_off')
    if (piecesLeft(fenBefore) > 6 && piecesLeft(botMove.after) <= 6) t.push('endgame_reached')
    if (isSacrifice(botMove)) t.push('sacrifice')
    if (isKingWalk(botMove, fenBefore)) t.push('king_walk')
  }
  return t
}

/**
 * A piece put where it can be taken: attacked by something cheaper, or
 * attacked and undefended, without having just captured something as good.
 * (Deliberate or not: Dex will call it a sacrifice either way.)
 */
function isSacrifice(move: Move): boolean {
  if (move.piece === 'p' || move.piece === 'k') return false
  if (move.captured && VALUES[move.captured] >= VALUES[move.piece]) return false
  const after = new Chess(move.after)
  const them = move.color === 'w' ? 'b' : 'w'
  const attackers = after.attackers(move.to as Square, them)
  if (attackers.length === 0) return false
  const defended = after.attackers(move.to as Square, move.color).length > 0
  const cheaper = attackers.some((sq) => VALUES[after.get(sq)!.type] < VALUES[move.piece])
  return cheaper || !defended
}

/** The king strolling up the board in the middlegame (not castling, not an ending). */
function isKingWalk(move: Move, fenBefore: string): boolean {
  if (move.piece !== 'k' || move.isKingsideCastle() || move.isQueensideCastle()) return false
  if (piecesLeft(fenBefore) <= 6) return false
  const rank = Number(move.to[1])
  const fromRank = Number(move.from[1])
  // Any step forward off the back rank counts (the Bongcloud's Ke2 included).
  return move.color === 'w' ? rank > fromRank : rank < fromRank
}
