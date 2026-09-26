// Competitive games (Joseph, Sep 2026): no move ratings on screen. Only the
// big moments show, and only in the opponent: a great move (the winning
// shot, found straight after they slipped) or a blunder. Their face changes,
// and now and then there's a stage direction.
import type { MoveRating } from './moveRating'

export type MatchMoment = 'great' | 'blunder' | null

/**
 * `winAfter` is the player's winning chance after this move; `previousWin`
 * after their move before. A great move is a best move that turns a roughly
 * level game (or worse) into a clearly winning one.
 */
export function matchMoment(rating: MoveRating, winAfter: number | null, previousWin: number | null): MatchMoment {
  if (rating === 'blunder') return 'blunder'
  if (rating === 'best' && winAfter !== null && winAfter >= 0.8 && (previousWin === null || previousWin <= 0.65)) {
    return 'great'
  }
  return null
}
