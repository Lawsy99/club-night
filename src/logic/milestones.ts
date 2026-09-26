// Milestones (design document, "Milestones"): one-time moments, shown as a
// small banner after the game. Never a checklist. Pure: the game flow
// gathers the facts and stores which milestones have been reached.

export type MilestoneFacts = {
  won: boolean
  /** A rated game (the rating moved). */
  rated: boolean
  opponent: string | null
  opponentName: string | null
  opponentRating: number
  ratingBefore: number | null
  ratingAfter: number | null
  /** The opponent's winning run against the player before this game. */
  theirStreakBefore: number
  /** Club regulars the player has now beaten in a real game (including this one). */
  regularsBeaten: readonly string[]
  /** Everyone who counts as a club regular. */
  regulars: readonly string[]
  /** Fixed characters' ratings (Marjorie, Clive, Graham). */
  fixedRatings: Record<string, number>
  /** Mistakes plus blunders by the player, if the game was reviewed. */
  errors: number | null
}

export type Milestone = { id: string; text: string }

/** New milestones from this game, given the ids already reached. */
export function newMilestones(f: MilestoneFacts, reached: readonly string[], names: Record<string, string> = {}): Milestone[] {
  const found: Milestone[] = []
  const add = (id: string, text: string) => {
    if (!reached.includes(id) && !found.some((m) => m.id === id)) found.push({ id, text })
  }

  if (f.won && f.ratingBefore !== null && f.opponentRating > f.ratingBefore) {
    add('beat-higher', `First win against a higher-rated player: ${f.opponentName ?? 'them'}, ${f.opponentRating}.`)
  }
  if (f.won && f.theirStreakBefore >= 3 && f.opponent) {
    add(`streak-broken:${f.opponent}`, `You beat ${f.opponentName} after ${f.theirStreakBefore} losses in a row.`)
  }
  if (f.won && f.regulars.length > 0 && f.regulars.every((r) => f.regularsBeaten.includes(r))) {
    add('beat-every-regular', "You've beaten every club regular.")
  }
  if (f.errors === 0) add('clean-game', 'First game with no mistakes or blunders.')

  if (f.rated && f.ratingBefore !== null && f.ratingAfter !== null) {
    const before = Math.floor(f.ratingBefore / 100)
    const after = Math.floor(f.ratingAfter / 100)
    if (after > before) add(`rating-${after * 100}`, `Your rating passed ${after * 100}.`)
    for (const [id, theirs] of Object.entries(f.fixedRatings)) {
      if (f.ratingBefore < theirs + 200 && f.ratingAfter >= theirs + 200) {
        add(`passed:${id}`, `You're now 200 points above ${names[id] ?? id}.`)
      }
    }
  }
  return found
}

/**
 * Milestones the next opponent (whoever it is) might mention at the start of
 * the next game. Only ones everyone at the club would know about.
 */
export function noticeFor(milestones: readonly Milestone[]): string | null {
  return milestones.some((m) => m.id.startsWith('rating-')) ? 'rating' : null
}
