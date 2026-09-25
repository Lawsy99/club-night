// Pure chess-game logic, independent of any screen. Wraps chess.js.
//
// A game is stored as a list of moves in "UCI" form (e.g. "e2e4", "e7e8q"),
// the same notation Stockfish speaks. The position is always rebuilt by
// replaying that list from the start, because a single board snapshot can't
// tell you about threefold repetition, and the list makes takebacks and
// resuming trivial.
import { Chess, type Move, type Square } from 'chess.js'

export type Colour = 'w' | 'b'
export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export type DrawReason = 'stalemate' | 'threefold' | 'insufficient' | 'fifty-move' | 'agreement'
export type GameOutcome =
  | { winner: Colour; reason: 'checkmate' | 'resignation' }
  | { winner: null; reason: DrawReason }

/** Rebuilds a chess.js game from a list of UCI moves. Throws if any is illegal. */
export function replay(moves: readonly string[]): Chess {
  const chess = new Chess()
  for (const uci of moves) {
    if (!applyUci(chess, uci)) throw new Error(`Illegal move in saved game: ${uci}`)
  }
  return chess
}

/** Plays a UCI move on the given game. Returns the move, or null if illegal. */
export function applyUci(chess: Chess, uci: string): Move | null {
  try {
    return chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    })
  } catch {
    // chess.js throws on illegal moves; we'd rather just say "no".
    return null
  }
}

export function toUci(move: Pick<Move, 'from' | 'to' | 'promotion'>): string {
  return move.from + move.to + (move.promotion ?? '')
}

/** Squares the piece on `from` can legally move to. */
export function legalTargets(chess: Chess, from: Square): Square[] {
  return chess.moves({ square: from, verbose: true }).map((m) => m.to)
}

/** True if moving from → to is a pawn promotion (so we must ask which piece). */
export function isPromotion(chess: Chess, from: Square, to: Square): boolean {
  return chess
    .moves({ square: from, verbose: true })
    .some((m) => m.to === to && m.isPromotion())
}

/** How the game ended, or null if it's still going. */
export function getOutcome(chess: Chess): GameOutcome | null {
  if (chess.isCheckmate()) {
    // The side to move has been mated, so the other side won.
    return { winner: chess.turn() === 'w' ? 'b' : 'w', reason: 'checkmate' }
  }
  if (chess.isStalemate()) return { winner: null, reason: 'stalemate' }
  if (chess.isInsufficientMaterial()) return { winner: null, reason: 'insufficient' }
  if (chess.isThreefoldRepetition()) return { winner: null, reason: 'threefold' }
  if (chess.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty-move' }
  return null
}

/** The square of the king that is in check, if any (for highlighting). */
export function checkedKingSquare(chess: Chess): Square | null {
  if (!chess.inCheck()) return null
  return chess.findPiece({ type: 'k', color: chess.turn() })[0] ?? null
}

/**
 * Turns an engine line (UCI moves from `fen`) into readable notation,
 * e.g. "12. Nf3 Nc6 13. Bb5" or "12… Nc6 13. Bb5".
 */
export function formatLine(fen: string, uciMoves: readonly string[], maxMoves = 8): string {
  const chess = new Chess(fen)
  const parts: string[] = []
  for (const [i, uci] of uciMoves.slice(0, maxMoves).entries()) {
    const moveNumber = chess.moveNumber()
    const whiteToMove = chess.turn() === 'w'
    const move = applyUci(chess, uci)
    if (!move) break
    if (whiteToMove) parts.push(`${moveNumber}. ${move.san}`)
    else parts.push(i === 0 ? `${moveNumber}… ${move.san}` : move.san)
  }
  return parts.join(' ')
}

/** Plain-English description of a finished game, for the result banner. */
export function describeOutcome(outcome: GameOutcome): string {
  const side = (c: Colour) => (c === 'w' ? 'White' : 'Black')
  switch (outcome.reason) {
    case 'checkmate':
      return `Checkmate. ${side(outcome.winner)} wins.`
    case 'resignation':
      return `${side(outcome.winner === 'w' ? 'b' : 'w')} resigned. ${side(outcome.winner)} wins.`
    case 'stalemate':
      return 'Stalemate. Draw.'
    case 'insufficient':
      return 'Not enough material to mate. Draw.'
    case 'threefold':
      return 'Same position three times. Draw.'
    case 'fifty-move':
      return 'Fifty moves without a capture or pawn move. Draw.'
    case 'agreement':
      return 'Draw agreed.'
  }
}
