// Which dialogue triggers the opponent's latest move sets off (design
// document, "Triggers"). The player's move quality comes from the move rating.
import type { Move } from 'chess.js'
import type { Trigger } from './dialogue'
import type { MoveRating } from './moveRating'

export type TriggerInputs = {
  /** The opponent's move just played. */
  botMove: Move
  /** The player's previous move, rated (null if not yet known). */
  playerRating: MoveRating | null
  /** The opponent's evaluation of the position, before this move (centipawns, its view). */
  botEvalCp: number | null
}

export function triggersFor({ botMove, playerRating, botEvalCp }: TriggerInputs): Trigger[] {
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
  return t
}
