// How closely Pemberton watches your moves (Joseph, Sep 2026: help that fades
// as you improve, and says so). Set once a week from how often you've been
// blundering lately: the fewer blunders, the less often his "are you sure?"
// steps in. When it changes, he mentions it.

/** How often he steps in before a bad move, by level (0 = barely, 3 = most of the time). */
export const STEP_IN_BY_LEVEL = [0.25, 0.45, 0.6, 0.8]

/** The level for a new player, or when there aren't enough games to judge. */
export const DEFAULT_WATCH = 2

/** Games needed to judge. */
const MIN_GAMES = 3

/** The level from blunders per game in recent games (newest first). */
export function watchLevel(blundersPerGame: readonly number[]): number {
  const recent = blundersPerGame.slice(0, 6)
  if (recent.length < MIN_GAMES) return DEFAULT_WATCH
  const rate = recent.reduce((a, b) => a + b, 0) / recent.length
  if (rate >= 1.5) return 3
  if (rate >= 0.75) return 2
  if (rate >= 0.3) return 1
  return 0
}

/** Pemberton, when the level changes from last week. Nothing if it hasn't. */
export function watchNote(previous: number | undefined, level: number): string | null {
  if (previous === undefined || previous === level) return null
  if (level < previous) {
    return level === 0
      ? 'I’ve all but stopped checking your moves. You don’t need me for that any more.'
      : 'I’ll be stepping in less this week. You’re not leaving things about like you were.'
  }
  return 'I’ll be keeping a closer eye on your moves this week. Humour me.'
}
