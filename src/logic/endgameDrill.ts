// Judging a finishing drill: have you done it, thrown it away, or run out of moves?
import { Chess } from 'chess.js'
import type { EndgamePosition } from '../data/endgameDrills'
import type { Colour } from './game'

export type DrillVerdict = 'going' | 'won' | 'stalemate' | 'drawn' | 'too-slow' | 'lost-it'

/**
 * Checked after each pair of moves (yours, then the defender's reply), and
 * after your move if it ends the game. `yourMoves` counts your moves so far.
 */
export function judgeEndgame(p: EndgamePosition, fen: string, you: Colour, yourMoves: number): DrillVerdict {
  const chess = new Chess(fen)
  if (chess.isCheckmate()) return chess.turn() === you ? 'lost-it' : 'won'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDraw()) return 'drawn'
  const pieces = chess.board().flat().filter((c) => c !== null)
  const mine = pieces.filter((c) => c!.color === you)
  // Promoting: done once a queen of yours has survived their reply.
  if (p.goal === 'promote' && chess.turn() === you && mine.some((c) => c!.type === 'q')) return 'won'
  // Nothing left to win with (e.g. the pawn or rook was lost).
  if (!mine.some((c) => c!.type !== 'k')) return 'lost-it'
  if (yourMoves >= p.maxMoves) return 'too-slow'
  return 'going'
}

/** Pemberton's word on a drill that didn't come off. */
export function endgameAdvice(verdict: DrillVerdict): string {
  switch (verdict) {
    case 'stalemate':
      return 'Stalemate. The king had no moves and wasn’t in check. Always leave it a square until the last move.'
    case 'drawn':
      return 'That’s drawn now. Start again and keep your pieces protected.'
    case 'too-slow':
      return 'Too slow: in a real game the fifty-move rule would be looming. Try again, with a plan.'
    case 'lost-it':
      return 'You’ve let it slip: there’s nothing left to win with. Keep everything protected.'
    default:
      return ''
  }
}
