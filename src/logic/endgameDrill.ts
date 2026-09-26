// Judging a finishing drill: have you done it, thrown it away, or run out of moves?
import { Chess } from 'chess.js'
import type { EndgamePosition } from '../data/endgameDrills'
import type { Colour } from './game'

export type DrillVerdict = 'going' | 'won' | 'stalemate' | 'drawn' | 'too-slow' | 'lost-it'

/**
 * Checked after each pair of moves (yours, then the engine's reply), and
 * after your move if it ends the game. `yourMoves` counts your moves so far.
 */
export function judgeEndgame(p: EndgamePosition, fen: string, you: Colour, yourMoves: number): DrillVerdict {
  const chess = new Chess(fen)
  const pieces = chess.board().flat().filter((c) => c !== null)
  const mine = pieces.filter((c) => c!.color === you)
  const theirs = pieces.filter((c) => c!.color !== you)

  // Defending: a draw of any kind, or surviving the moves, is the win.
  if (p.goal === 'hold') {
    if (chess.isCheckmate()) return chess.turn() === you ? 'lost-it' : 'won'
    if (chess.isDraw() || chess.isStalemate()) return 'won'
    // They've made a queen, and you can't take it back straight away.
    if (chess.turn() === you && theirs.some((c) => c!.type === 'q') && !mine.some((c) => c!.type === 'q')) {
      const canTake = chess.moves({ verbose: true }).some((m) => m.captured === 'q')
      if (!canTake) return 'lost-it'
    }
    return yourMoves >= p.maxMoves ? 'won' : 'going'
  }

  if (chess.isCheckmate()) return chess.turn() === you ? 'lost-it' : 'won'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDraw()) return 'drawn'
  // Promoting: done once a queen of yours has survived their reply.
  if (p.goal === 'promote' && chess.turn() === you && mine.some((c) => c!.type === 'q')) return 'won'
  // Nothing left to win with (e.g. the pawn or rook was lost).
  if (!mine.some((c) => c!.type !== 'k')) return 'lost-it'
  if (yourMoves >= p.maxMoves) return 'too-slow'
  return 'going'
}

/** Pemberton's word on a drill that didn't come off. */
export function endgameAdvice(verdict: DrillVerdict, goal: EndgamePosition['goal'] = 'mate'): string {
  if (goal === 'hold' && verdict === 'lost-it') {
    return 'They got through. Start again: keep your king in front, and make them move first.'
  }
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
