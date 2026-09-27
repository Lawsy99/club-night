// A "find a better move" moment: a position where the player went wrong.
// Shared by the review and the mistakes deck.
import type { Colour } from './game'

export type Moment = {
  fenBefore: string
  playerColour: Colour
  /** What the player actually played (UCI) and how it was written. */
  played: string
  playedSan: string
  bestMove: string
  /** The best available position value for the player, in centipawns. */
  bestCp: number
  explanation: string
  /**
   * The opponent's move just before, and the position before it (Joseph,
   * Sep 2026: seeing what they just did is the context the position needs).
   * Missing on positions saved by older versions; filled in from the game.
   */
  prevMove?: string
  prevFen?: string
  /**
   * 'missed': the opponent had just slipped up and the player didn't punish
   * it (Joseph, Sep 2026: missed opportunities, not only mistakes).
   * 'mistake' (or missing): the player's own error.
   */
  kind?: 'mistake' | 'missed'
  /** The engine's line from the position, starting with bestMove (Sep 2026; missing on older positions). */
  bestLine?: string[]
  /** The score after the move actually played, player's view (so both explanations judge alike). */
  playedCp?: number
}
