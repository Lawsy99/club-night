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
}
