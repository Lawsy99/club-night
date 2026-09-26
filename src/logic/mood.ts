// The opponent's face during a game follows how it's going for them
// (Joseph, Sep 2026): neutral while it's in the balance, then their own
// "winning" or "losing" look. Anything they've just said takes precedence.
import type { Expression } from './dialogue'

/** About one and a half pawns either way before it shows on their face. */
export const MOOD_THRESHOLD_CP = 150

export type Moods = { winning: Expression; losing: Expression }

/**
 * `cp` is the position from the opponent's own point of view (their latest
 * evaluation), or null before they've had a think.
 */
export function moodFor(moods: Moods | undefined, cp: number | null): Expression {
  if (!moods || cp === null) return 'neutral'
  if (cp >= MOOD_THRESHOLD_CP) return moods.winning
  if (cp <= -MOOD_THRESHOLD_CP) return moods.losing
  return 'neutral'
}
